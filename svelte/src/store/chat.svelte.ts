import OpenAI from "openai";
import { writableHook } from "./hooks";
import { createHighlighter } from "shiki";
import type { basePayload, inTypeUnion } from "../../../src/workers/types";
import { type chunckType, type extensionState, receiveStreamChunk } from "../../../common";
import { Marked, type Token, type Tokens, type TokensList } from "marked";
import { v4 } from "uuid";
import { codeStore as codeApi } from "./vscode";

export const extensionStateStore = writableHook<extensionState | undefined>({
  initialValue: undefined,
  onUpdate(previousValue, newValue) {
    console.log("_UPDATE_STATE_", newValue);
    return newValue;
  },
})


type renderFunction = (message: Partial<chunckType>) => Promise<void>;
type renderer = {
  render: renderFunction,
  readonly html: string,
  [key: string]: any
};
type createRendererFn = () => renderer;

export interface chatReader {
  length: number,
  loaded: Partial<chunckType>[],
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
      if (!reader.loaded.length)
        reader.loaded.push({});
      reader.loaded[reader.loaded.length - 1] = receiveStreamChunk(reader.loaded.at(-1), chunk);
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
  let markdown = $state("");
  let tokens: TokensList | [] = $state.raw([]);
  let html = $derived(markedInstance.parser(tokens));

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
    // get markdown() {
    //   return markdown;
    // },
    // setMarkdown(newMarkdown: typeof markdown) {
    //   markdown = newMarkdown;
    // },
    // get tokens() {
    //   return tokens;
    // },
    // setTokens(newTokens: typeof tokens) {
    //   tokens = newTokens;
    // },
    get html() {
      return html;
    },
    async render(message: Partial<chunckType>) {
      if (!message.choices)
        return ;
      markdown = message.choices[0].delta.content || "";
      const newTokens = markedInstance.Lexer.lex(markdown);
      await Promise.all(
          newTokens.map((token, index) =>
              walkTokens(token, index),
          ),
      );
      tokens = newTokens;
    }
  };
};

export const chatStreaming = createStreaming(() => createChatMarkedRender(chatMarkedInstance));

const codeBlockHighlightState: Map<string, string> = $state(new Map<string, string>());
export const codeBlockHighlight = () => codeBlockHighlightState;