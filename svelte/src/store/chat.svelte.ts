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
  let ExtensionState = $state<ExtensionState | undefined>(undefined);
  $effect(() => {

  });
  return {
    get value() {
      return ExtensionState
    },
    set(newState: ExtensionState) {
      ExtensionState = newState
    }
  }
}

export const _ExtensionState = createExtensionState();

export const ExtensionStateStore = writableHook<ExtensionState | undefined>({
  initialValue: undefined,
  copyMethod: (value) => structuredClone(value),
  onUpdate(previousValue, newValue) {
    if (!previousValue || !newValue || newValue.workspace.ui.conversationId == NONE_SENTINEL)
      return newValue;
    let cache = LLMMessagesRendererCache.getCache;
    if (!cache.has(newValue.workspace.ui.conversationId))
      LLMMessagesRendererCache.create(newValue.workspace.ui.conversationId);

    const currentMessagesCache = cache.get(newValue.workspace.ui.conversationId);
    if (!currentMessagesCache)
      throw new Error("Message cache undefined");

    let i = currentMessagesCache.index;
    while (i < newValue.workspace.messages.length) {
      if (i >= currentMessagesCache.renderer.length) {
        const newRenderer = createChatMarkedRender(chatMarkedInstance);
        LLMMessagesRendererCache.update(newValue.workspace.ui.conversationId, { renderer: [...currentMessagesCache.renderer, newRenderer], index: currentMessagesCache.index })
      }
      const renderer = currentMessagesCache.renderer[i];
      if (typeof renderer != "string") // If it is a string, the message is rendered by a component so we skip it
        renderer.render(newValue.workspace.messages[i]);
      i++;
    }
    // // If we're streaming, the cache must re-render last index on next state update
    if (newValue.workspace.streamState)
      i = newValue.workspace.messages.length - 1;
    // LLMMessagesRendererCache.update(newValue.workspace.ui.conversationId, {...currentMessagesCache, index: i});
    return newValue;
  },
})
// Creating a reference without the store value undefined to avoid '?', this reference should only be used in pages that guarantee the state is not undefined
export const ExtensionStateStoreInitialized = ExtensionStateStore as WritableHook<ExtensionState>;

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