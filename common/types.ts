import type OpenAI from "openai";
import { FragolaClient } from "../src/Fragola/Fragola";

export type chunckType = OpenAI.Chat.Completions.ChatCompletionChunk;
export interface userMessageMetaData {
    fileAttachments: string[]
}
export type messageExtentedType = messageType & userMessageMetaData;
export type messageType = OpenAI.Chat.Completions.ChatCompletionMessageParam;
export interface extensionState {
    chat: Pick<FragolaClient.InstanceState['chat'], "id" | "isTmp">
}
export interface appendMessage {
    id: string,
    index: number,
    message: messageType
}

export const defaultExtensionState: extensionState = {
    chat: {
        id: undefined,
        isTmp: true
    }
}