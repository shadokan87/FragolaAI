import OpenAI from "openai";
import { writableHook } from "./hooks";
import type { basePayload, inTypeUnion } from "../../../src/workers/types";
import { type chunkType, type extensionState, receiveStreamChunk, type MessageType, streamChunkToMessage } from "../../../common";
import { Marked, type Token, type Tokens, type TokensList } from "marked";
import { v4 } from "uuid";
import { codeStore as codeApi } from "./vscode";
import { readableStreamAsyncIterable } from "openai/streaming.mjs";


type renderFunction = (message: Partial<MessageType>) => Promise<void>;
export type renderedByComponent = "user" | "tool";
export type renderer = {
  render: renderFunction,
  readonly html: string,
  [key: string]: any
};
type createRendererFn = () => renderer;

export const TMP_READER_SENTINEL = "<TMP>";
export interface chatReader {
  length: number,
  loaded: Partial<MessageType>[],
  renderer: (renderer | renderedByComponent)[]
}

export const chatReaderDefault: chatReader = {
  length: 0,
  loaded: [],
  renderer: []
}

export function createChatReader(values: chatReader = chatReaderDefault) {
  let length = $state(values.length);
  let loaded = $state.raw(values.loaded);
  let renderer = $state(values.renderer);
  return {
    get length() {
      return length;
    },
    set length(value: number) {
      length = value;
    },
    get loaded() {
      return loaded;
    },
    set loaded(value: Partial<MessageType>[]) {
      loaded = value;
    },
    get renderer() {
      return renderer;
    },
    set renderer(value: (renderer | renderedByComponent)[]) {
      renderer = value;
    }
  }
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
      reader.loaded = [...reader.loaded, {}];
      reader.length = reader.length + 1;
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
    receiveChunk(id: string, chunk: chunkType) {
      const reader = readers.get(id)
      if (!reader)
        throw new Error("Reader undefined");
      console.log("__READER__", reader);
      const asMessage = streamChunkToMessage(chunk, reader.loaded.at(-1));
      const newLoaded = [...reader.loaded];
      newLoaded[newLoaded.length - 1] = asMessage;
      reader.loaded = newLoaded;
      
      if (["tool"].includes(chunk.choices[0].delta.role || "")) {
        reader.renderer = [...reader.renderer, chunk.choices[0].delta.role as renderedByComponent];
      } else {
        if (!reader.renderer[reader.loaded.length - 1]) {
          reader.renderer = [...reader.renderer, createRenderer()];
        }
          (async () => {
            await (reader.renderer.at(-1) as renderer)?.render(asMessage)
          })();
      }
      update = !update;
    }
  }
}

export const extensionStateStore = writableHook<extensionState | undefined>({
  initialValue: undefined,
  // onUpdate(previousValue, newValue) {
  //   if (!newValue?.chat.id) {
  //     console.log("No chat id");
  //     return newValue;
  //   }
  //   let defaultReaderValue: chatReader = chatReaderDefault;
  //   const isFirstChatResponse = previousValue?.chat.isTmp && !newValue.chat.isTmp;
  //   if (isFirstChatResponse) {
  //     const tmpReader = chatStreaming.readers.get(TMP_READER_SENTINEL);
  //     if (tmpReader) {
  //       defaultReaderValue = { ...tmpReader };
  //       chatStreaming.readers.delete(TMP_READER_SENTINEL);
  //     }
  //   }
  //   if (!chatStreaming.readers.get(newValue.chat.id)) // Prepare reader to receive data
  //     chatStreaming.readers.set(newValue.chat.id, createChatReader(defaultReaderValue));
  //   return newValue;
  // },
})

export function staticMessageHandler(streaming: ReturnType<typeof createStreaming>, createRenderer?: createRendererFn) {
  const _createRenderer: createRendererFn = createRenderer || streaming.getCreateRenderer();

  return {
    append(message: MessageType, id: string) {
      let reader = streaming.readers.get(id);
      if (!reader) {
        streaming.readers.set(id, createChatReader());
        reader = streaming.readers.get(id);
      }
      if (!reader) {
        throw new Error("Failed to create reader");
      }
      const newRenderer = _createRenderer();
      reader.loaded = [...reader.loaded, message];
      reader.renderer = [...reader.renderer, newRenderer];
      
      (async () => {
        await newRenderer.render(message);
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
        // const content = codeBlockHighlight().get(id);
        const content = token.text;
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
    async render(message: Partial<MessageType>) {
      let newTokens: TokensList | undefined = undefined;
      switch (message.role) {
        case "user": // Intentional no-break
        case "assistant": {
          if (!message.content)
            return;
          markdown = Array.isArray(message.content) ? message.content.join(' ') : message.content;
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