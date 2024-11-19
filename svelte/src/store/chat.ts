import OpenAI from "openai";
import { writableHook } from "./hooks";
import type { chunckType } from "../types";
import { createHighlighter } from "shiki";
// OpenAI.Chat.Completions.ChatCompletionMessageParam
interface Discussion {
    id: string,
    messages: chunckType[]
}

export const chatStore = writableHook<Discussion[]>({
    initialValue: [],
});

export const highlighterStore = writableHook<Awaited<ReturnType<typeof createHighlighter>> | undefined>({
  initialValue: undefined
})