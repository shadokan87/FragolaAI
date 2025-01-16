import OpenAI from "openai";
import { writableHook, type WritableHook } from "./hooks";
import type { basePayload, inTypeUnion } from "../../../src/workers/types";
import { type chunkType, type ExtensionState, receiveStreamChunk, type MessageType, streamChunkToMessage, NONE_SENTINEL, type ConversationId } from "../../../common";
import { Marked, type Token, type Tokens, type TokensList } from "marked";
import { v4 } from "uuid";
import { codeStore as codeApi } from "./vscode";
import { render } from "svelte/server";


type renderFunction = (message: Partial<MessageType>) => Promise<void>;
export type renderedByComponent = "user" | "tool";
export type renderer = {
  render: renderFunction,
  readonly html: string,
  [key: string]: any
};

export interface ChatView {
  // messages: ExtensionState["workspace"]["messages"],
  renderer: (renderer | renderedByComponent)[],
  index: number
}
type createRendererFn = (message: ExtensionState["workspace"]["messages"][0]) => ChatView["renderer"][0];

// Simple runtime cache for markdown rendering
export function createMessagesCache() {
  let readers = $state<Map<ConversationId, ChatView>>(new Map());

  return {
    create(conversationId: ConversationId) {
      readers.set(conversationId, { renderer: [], index: 0 })
    },
    get getCache() {
      return readers;
    },
    update(conversationId: ConversationId, newValue: ChatView) {
      readers.set(conversationId, newValue);
      console.log("__READERS__", readers);
    }
  }
}

export const LLMMessagesRendererCache = createMessagesCache();

export function createExtensionState() {
  let extensionState = $state<ExtensionState | undefined>(undefined);
  // Using this variable to check for undefined to avoid "?" everywhere
  let isDefined = $derived(extensionState != undefined);
  $effect(() => {

  });
  return {
    get isDefined() {
      return isDefined
    },
    get value() {
      return extensionState as ExtensionState
    },
    set(newState: ExtensionState) {
      extensionState = newState
    }
  }
}

export const extensionState = createExtensionState();

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