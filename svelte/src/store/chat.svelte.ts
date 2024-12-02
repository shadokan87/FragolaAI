import OpenAI from "openai";
import { writableHook } from "./hooks";
import { createHighlighter } from "shiki";
import type { basePayload, inTypeUnion } from "../../../src/workers/types";
import { type chunckType, type extensionState, receiveStreamChunk, type messageType, streamChunkToMessage } from "../../../common";
import { Marked, type Token, type Tokens, type TokensList } from "marked";
import { v4 } from "uuid";
import { codeStore as codeApi } from "./vscode";
import { readableStreamAsyncIterable } from "openai/streaming.mjs";

export const extensionStateStore = writableHook<extensionState | undefined>({
  initialValue: undefined,
  onUpdate(previousValue, newValue) {
    if (!newValue?.chat.id) {
      console.log("No chat id");
      return newValue;
    }
    let defaultReaderValue: chatReader = {
      length: 1,
      loaded: [],
      renderer: []
    }
    const isFirstChatResponse = previousValue?.chat.isTmp && !newValue.chat.isTmp;
    if (isFirstChatResponse) { // Previous state was tmp which means this is a new chat with 1st response case
      const tmpReader = chatStreaming.readers.get(TMP_READER_SENTINEL);
      if (tmpReader) { // Should normally be set as it contains first user message
        /* We keep the tmp state saved earlier for the currently new message and delete the tmp
        Because we did not receive the chat.id immediately */
        defaultReaderValue = { ...tmpReader };
        chatStreaming.readers.delete(TMP_READER_SENTINEL);
      }
    }
    if (!chatStreaming.readers.get(newValue.chat.id)) // Prepare reader to receive data
      chatStreaming.readers.set(newValue.chat.id, defaultReaderValue);
    return newValue;
  },
})


type renderFunction = (message: Partial<messageType>) => Promise<void>;
export type noRenderer = "user" | "tool";
export type renderer = {
  render: renderFunction,
  readonly html: string,
  [key: string]: any
};
type createRendererFn = () => renderer;

export const TMP_READER_SENTINEL = "<TMP>";
export interface chatReader {
  length: number,
  loaded: Partial<messageType>[],
  renderer: (renderer | noRenderer)[]
}

/**
 * Creates a streaming manager to handle chat streaming state and readers
 * @param createRenderer - Function that creates a new renderer instance
 */
export function createStreaming(createRenderer: createRendererFn) {
  let streamingState = $state<string | null>(null); // null when not streaming, chat ID when streaming
  const readers: Map<string, chatReader> = $state(new Map());
  let update = $state(false);

  return {
    getCreateRenderer() {
      return createRenderer;
    },
    get update() {
      return update;
    },
    /**
     * Gets the map of chat readers
     * @returns Map of chat readers indexed by ID
     */
    get readers() {
      return readers;
    },
    /**
     * Gets the current streaming state
     * @returns Chat ID if streaming, null if not streaming
     */
    get streamingState() {
      return streamingState
    },
    /**
     * Checks if streaming is currently active
     * @returns Boolean indicating streaming status
     */
    isStreaming() {
      return streamingState !== null
    },
    /**
     * Starts the streaming state for a specific chat
     * @param id - The ID of the chat that is streaming
     */
    stream(id: string) {
      const reader = readers.get(id)
      if (!reader)
        throw new Error("Reader undefined");
      // if (!(reader.loaded.length))
      reader.loaded.push({});
      streamingState = id
    },
    /**
     * Stops the streaming state
     */
    stopStream() {
      streamingState = null
    },
    /**
     * Receives and processes a new chunk for a specific chat
     * @param id - The ID of the chat to receive the chunk
     * @param chunk - The chunk data to process
     */
    receiveChunk(id: string, chunk: chunckType) {
      const reader = readers.get(id)
      if (!reader)
        throw new Error("Reader undefined");
      const asMessage = streamChunkToMessage(chunk, reader.loaded.at(-1));
      reader.loaded[reader.loaded.length - 1] = asMessage;
      console.log("__READER__", reader);
      readers.set(id, reader);

      if (!reader.renderer.length || !reader.renderer[reader.loaded.length - 1]) {
        if (chunk.choices[0].delta.role != "user" && chunk.choices[0].delta.role != "tool") {
          reader.renderer.push(createRenderer());
          (async () => {
            await (reader.renderer[reader.loaded.length - 1] as renderer).render(reader.loaded[reader.loaded.length - 1])
          })();
        } else
          reader.renderer.push(chunk.choices[0].delta.role);
      }
      update = !update;
    }
  }
}

export function staticMessageHandler(streaming: ReturnType<typeof createStreaming>, createRenderer?: createRendererFn) {
  const _createRenderer: createRendererFn = createRenderer || streaming.getCreateRenderer();

  return {
    append(message: messageType, id: string) {
      let reader = streaming.readers.get(id);
      if (!reader) {
        streaming.readers.set(id, { length: 0, loaded: [], renderer: [] });
        reader = streaming.readers.get(id);
      }
      if (!reader) {
        throw new Error("Failed to create reader");
      }
      reader.loaded.push(message);
      const renderer = _createRenderer();
      reader.renderer.push(renderer);
      (async () => {
        await renderer.render(reader.loaded[reader.loaded.length - 1]);
      })();
    }
  }
}

const chatMarkedInstance = new Marked().use({
  renderer: {
    code(token: Tokens.Code) {
      const el = document.createElement("code-block");
      const id: string | undefined = (token as any)['id'];
      if (id) {
        const content = codeBlockHighlight().get(id);
        el.setAttribute("content", content ? content : "");
      }
      el.setAttribute("lang", token.lang || "");
      // el.setAttribute("content", token.text);
      return el.outerHTML;
    },
  },
});

const createChatMarkedRender = (markedInstance: Marked): renderer => {
  let markdown: string = $state("");
  let tokens: TokensList | [] = $state.raw([]);
  let html: string = $derived(markedInstance.parser(tokens));

  const walkTokens = async (
    token: Token,
    index: number,
  ) => {
    if (token.type === "code") {
      if (
        tokens[index] &&
        tokens[index].type == "code" &&
        (tokens[index] as any)["id"]
      ) {
        (token as any)["id"] = (tokens[index] as any)["id"];
      } else (token as any)["id"] = v4();
      const unsubscribe = codeApi?.subscribe(v => v?.postMessage({
        type: "syntaxHighlight",
        data: token.text,
        id: (token as any)["id"],
      }));
      unsubscribe();
    }
  };

  return {
    get html() {
      return html;
    },
    async render(message: Partial<messageType>) {
      let newTokens: TokensList | undefined = undefined;
      switch (message.role) {
        case "user": // Intentional no-break
        case "assistant": {
          if (!message.content)
            return;
          markdown = Array.isArray(message.content) ? message.content.join(' ') : message.content;
          // console.log("__MARKDOWN__", markdown);
          newTokens = markedInstance.Lexer.lex(markdown);
          break;
        }
      }
      if (newTokens) {
        await Promise.all(
          newTokens.map((token, index) =>
            walkTokens(token, index),
          ),
        );
        tokens = newTokens;
      }
    }
  };
};

export const chatStreaming = createStreaming(() => createChatMarkedRender(chatMarkedInstance));

const codeBlockHighlightState: Map<string, string> = $state(new Map<string, string>());
export const codeBlockHighlight = () => codeBlockHighlightState;