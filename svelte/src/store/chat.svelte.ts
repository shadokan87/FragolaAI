import OpenAI from "openai";
import { writableHook, type WritableHook } from "./hooks";
import type { basePayload, inTypeUnion } from "../../../src/workers/types";
import { type chunkType, type ExtensionState, receiveStreamChunk, type MessageType, streamChunkToMessage, NONE_SENTINEL, type ConversationId, Mutex } from "../../../common";
import { Marked, type Token, type Tokens, type TokensList } from "marked";
import { v4 } from "uuid";
import { codeStore as codeApi } from "./vscode";
import { render } from "svelte/server";


type renderFunction = (message: Partial<MessageType>) => void;
export type renderedByComponent = "user" | "tool";
export type renderer = {
  render: renderFunction,
  readonly html: string,
  [key: string]: any
};
export type RendererLike = renderer | renderedByComponent;
export const MessagesRolesToRenderWithMarkDown = ["assistant"];

// type createRendererFn = (message: ExtensionState["workspace"]["messages"][0]) => renderer;

// Simple runtime cache for markdown rendering
export function createMessagesCache() {
  let readers = $state<Map<ConversationId, RendererLike[]>>(new Map());

  return {
    create(conversationId: ConversationId) {
      readers.set(conversationId, [])
    },
    get value() {
      return readers;
    },
    update(conversationId: ConversationId, newValue: RendererLike[]) {
      readers.set(conversationId, newValue);
      console.log("__READERS__", readers);
    }
  }
}

export const LLMMessagesRendererCache = createMessagesCache();

export function createExtensionState() {
  let extensionState = $state<ExtensionState | undefined>(undefined);
  return {
    get isDefined() {
      return extensionState != undefined
    },
    get value() {
      return extensionState as ExtensionState
    },
    lastMessageByRole(role: MessageType["role"], index?: number): MessageType | null {
      const messages = extensionState?.workspace.messages;
      if (!messages || !messages.length)
        return null;
      let i = index ? index : messages.length - 1;
      for (; i >= 0; i--) {
        if (messages[i].role == role)
          return messages[i];
      }
      return null;
    },
    set(newState: ExtensionState) {
      // Prepare empty cache for new conversation
      if (newState.workspace.ui.conversationId != NONE_SENTINEL && !LLMMessagesRendererCache.value.has(newState.workspace.ui.conversationId))
        LLMMessagesRendererCache.update(newState.workspace.ui.conversationId, []);
      extensionState = newState
    }
  }
}

export const extensionState = createExtensionState();

export const chatMarkedInstance = new Marked().use({
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

export const createChatMarkedRender = (markedInstance: Marked): renderer => {
  let markdown: string = $state("");
  let tokens: TokensList | [] = $state.raw([]);
  let html: string = $derived(markedInstance.parser(tokens));
  const mutex = new Mutex();

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
    render(message: Partial<MessageType>) {
      let newTokens: TokensList | undefined = undefined;
      (async () => {
        await mutex.acquire();
        try {
          switch (message.role) {
            case "assistant": {
              if (!message.content)
                return;
              markdown = Array.isArray(message.content) ? message.content.join(' ') : message.content;
              newTokens = markedInstance.Lexer.lex(markdown);
              break;
            }
          }
          if (newTokens) {
            (async () => {
              await Promise.all(
                newTokens.map((token, index) =>
                  walkTokens(token, index),
                ),
              );
              tokens = newTokens;
            })();
          }
        } finally {
          mutex.release();
        }
      })();
    }
  };
};