import OpenAI from "openai";
import { writableHook } from "./hooks";
import type { chunckType } from "../types";
// OpenAI.Chat.Completions.ChatCompletionMessageParam
interface Discussion {
    id: string,
    messages: chunckType[]
}

export const chatStore = writableHook<Discussion[]>({
    initialValue: [],
});