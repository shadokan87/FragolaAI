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
    // console.log("_UPDATE_STATE_", newValue);
    return newValue;
  },
})


type renderFunction = (message: Partial<messageType>) => Promise<void>;
type renderer = {
  render: renderFunction,
  readonly html: string,
  [key: string]: any
};
type createRendererFn = () => renderer;

export interface chatReader {
  length: number,
  loaded: Partial<messageType>[],
  renderer: renderer[]
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

      if (!reader.renderer.length || !reader.renderer[reader.loaded.length - 1])
        reader.renderer.push(createRenderer());
      (async () => {
        await reader.renderer[reader.loaded.length - 1].render(reader.loaded[reader.loaded.length - 1])
      })();
      update = !update;
    }
  }
}

export function staticMessageHandler(streaming: ReturnType<typeof createStreaming>, createRenderer?: createRendererFn) {
  const _createRenderer: createRendererFn = createRenderer || streaming.getCreateRenderer();

  return {
    insertAtIndex(message: messageType, id: string, index: number) {
      let reader = streaming.readers.get(id);
      if (!reader) {
        streaming.readers.set(id, {length: 0, loaded: [], renderer: []});
        reader = streaming.readers.get(id);
      }
      if (!reader) {
        throw new Error("Failed to create reader");
      }
      reader.loaded.splice(index, 0, message);
      const renderer = _createRenderer();
      reader.renderer.splice(index, 0, renderer);
      (async () => {
        await renderer.render(reader.loaded[index]);
      })();
    },

    append(message: messageType, id: string) {
      let reader = streaming.readers.get(id);
      if (!reader) {
        streaming.readers.set(id, {length: 0, loaded: [], renderer: []});
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