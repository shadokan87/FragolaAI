import OpenAI from "openai";
import { writableHook } from "./hooks";
// OpenAI.Chat.Completions.ChatCompletionMessageParam
interface Discussion {
    id: string,
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
}

export const chatStore = writableHook<Discussion[]>({
    initialValue: [],
});