import OpenAI from "openai";
import { writableHook } from "./hooks";
import type { chunckType } from "../types";
import { createHighlighter } from "shiki";
import type { basePayload, inTypeUnion } from "../../../src/workers/types";
// OpenAI.Chat.Completions.ChatCompletionMessageParam
interface Discussion {
    id: string,
    messages: chunckType[]
}

export const chatStore = writableHook<Discussion[]>({
    initialValue: [],
});

export const highlighterStore = writableHook<Map<string, string>>({
  initialValue: new Map<string, string>()
});

const codeBlockHighlightState: Map<string, string> = $state(new Map<string, string>());
export const codeBlockHighlight = () => codeBlockHighlightState;

export const specificRequestsStore = writableHook<basePayload<inTypeUnion>[]>({
  initialValue: []
})

let specificRequestsState: basePayload<inTypeUnion>[] = $state([]);

// export const addRequest = (request: typeof specificRequestsState[0]) => specificRequestsState = [...specificRequestsState, request];
// export const specificRequests = () => specificRequestsState;