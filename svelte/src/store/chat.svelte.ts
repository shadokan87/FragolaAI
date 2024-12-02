import OpenAI from "openai";
import { writableHook } from "./hooks";
import { createHighlighter } from "shiki";
import type { basePayload, inTypeUnion } from "../../../src/workers/types";
import { type chunckType, type extensionState, receiveStreamChunk, type messageType, streamChunkToMessage } from "../../../common";
import { Marked, type Token, type Tokens, type TokensList } from "marked";
import { v4 } from "uuid";
import { codeStore as codeApi } from "./vscode";
import { readableStreamAsyncIterable } from "openai/streaming.mjs";
import { BehaviorSubject } from 'rxjs';

export const extensionStateStore = writableHook<extensionState | undefined>({
  initialValue: undefined,
  onUpdate(previousValue, newValue) {
    if (!newValue?.chat.id) {
      console.log("No chat id");
      return newValue;
    }
    let defaultReaderValue: chatReader = {
      length: 1,
      loaded$: new BehaviorSubject<Partial<messageType>[]>([]),
      renderer: []
    }
    const isFirstChatResponse = previousValue?.chat.isTmp && !newValue.chat.isTmp;
    if (isFirstChatResponse) {
      const tmpReader = chatStreaming.readers.get(TMP_READER_SENTINEL);
      if (tmpReader) {
        defaultReaderValue = {
          length: tmpReader.length,
          loaded$: new BehaviorSubject(tmpReader.loaded$.getValue()),
          renderer: [...tmpReader.renderer]
        };
        chatStreaming.readers.delete(TMP_READER_SENTINEL);
      }
    }
    if (!chatStreaming.readers.get(newValue.chat.id))
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
  loaded$: BehaviorSubject<Partial<messageType>[]>,
  renderer: (renderer | noRenderer)[]
}

export function createStreaming(createRenderer: createRendererFn) {
  let streamingState = $state<string | null>(null);
  const readers: Map<string, chatReader> = $state(new Map());
  let update = $state(false);

  return {
    getCreateRenderer() {
      return createRenderer;
    },
    get update() {
      return update;
    },
    get readers() {
      return readers;
    },
    get streamingState() {
      return streamingState
    },
    isStreaming() {
      return streamingState !== null
    },
    stream(id: string) {
      const reader = readers.get(id)
      if (!reader)
        throw new Error("Reader undefined");
      const currentMessages = reader.loaded$.getValue();
      reader.loaded$.next([...currentMessages, {}]);
      streamingState = id
    },
    stopStream() {
      streamingState = null
    },
    receiveChunk(id: string, chunk: chunckType) {
      const reader = readers.get(id)
      if (!reader)
        throw new Error("Reader undefined");

      const currentMessages = reader.loaded$.getValue();
      const asMessage = streamChunkToMessage(chunk, currentMessages[currentMessages.length - 1]);
      const newMessages = [...currentMessages.slice(0, -1), asMessage];
      reader.loaded$.next(newMessages);

      console.log("__READER__", reader);
      readers.set(id, reader);

      if (["user", "tool"].includes(chunk.choices[0].delta.role || "")) {
        reader.renderer.push(chunk.choices[0].delta.role as noRenderer);
      } else {
        if (!reader.renderer[newMessages.length - 1])
          reader.renderer.push(createRenderer());
        (async () => {
          await (reader.renderer[newMessages.length - 1] as renderer).render(newMessages[newMessages.length - 1])
        })();
      }

      // if (!reader.renderer.length || !reader.renderer[newMessages.length - 1]) {
      //   if (chunk.choices[0].delta.role != "user" && chunk.choices[0].delta.role != "tool") {
      //     reader.renderer.push(createRenderer());
      //     (async () => {
      //       await (reader.renderer[newMessages.length - 1] as renderer).render(newMessages[newMessages.length - 1])
      //     })();
      //   } else
      //     reader.renderer.push(chunk.choices[0].delta.role);
      // }
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
        streaming.readers.set(id, {
          length: 0,
          loaded$: new BehaviorSubject<Partial<messageType>[]>([]),
          renderer: []
        });
        reader = streaming.readers.get(id);
      }
      if (!reader) {
        throw new Error("Failed to create reader");
      }
      const currentMessages = reader.loaded$.getValue();
      reader.loaded$.next([...currentMessages, message]);
      const renderer = _createRenderer();
      reader.renderer.push(renderer);
      (async () => {
        await renderer.render(message);
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
      // console.log("__CALL_RENDER__", message);
      let newTokens: TokensList | undefined = undefined;
      switch (message.role) {
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