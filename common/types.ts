import type OpenAI from "openai";
import { FragolaClient } from "../src/Fragola/Fragola";

export type chunckType = OpenAI.Chat.Completions.ChatCompletionChunk;
export interface extensionState {
    chat: Pick<FragolaClient.InstanceState['chat'], "id" | "isTmp">
}

export const defaultExtensionState: extensionState = {
    chat: {
        id: undefined,
        isTmp: true
    }
}