import type OpenAI from "openai";
import { FragolaClient } from "../src/Fragola/Fragola";
import { basePayload, inTypeUnion, outTypeUnion } from "../src/workers/types";

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
export type incommingPayload<T> = basePayload<inTypeUnion> & {parameters: T};
export type outPayload<T> = basePayload<outTypeUnion> & {parameters: T};
export namespace payloadTypes {
    export namespace svelte {
        export type history = incommingPayload<{
            // No data yet
        }>
    }
    export namespace vscode {
        
    }
}