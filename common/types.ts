import type OpenAI from "openai";
import { FragolaClient } from "../src/Fragola/Fragola";
import { basePayload, inTypeUnion, outTypeUnion } from "../src/workers/types";
import { CompletionResponseChunk } from "@shadokan87/token.js";

export type chunkType = CompletionResponseChunk;
export interface userMessageMetaData {
    mentions: {
        folders: string[],
        files: string[]
    }
}
export type promptType = {
    text: string,
    meta?: Partial<userMessageMetaData>
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
        export type history = outPayload<{
            // No data yet
        }>
    }
    export namespace vscode {
        export type history = incommingPayload<{
            ids: string[]
        }>;
    }
}