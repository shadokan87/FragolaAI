import type OpenAI from "openai";
import { FragolaClient } from "../src/Fragola/Fragola";
import { basePayload, inTypeUnion, outTypeUnion } from "../src/workers/types";
import { CompletionResponseChunk } from "@shadokan87/token.js";

export type chunkType = CompletionResponseChunk;

export enum InteractionMode {
    CHAT,
    BUILD
}

export interface userMessageMetaData {
    mentions: {
        folders: string[],
        files: string[]
    },
    interactionMode: InteractionMode
}

export type Prompt = {
    text: string,
    meta?: Partial<userMessageMetaData>
}

export type messageExtentedType = messageType & userMessageMetaData;

export type messageType = OpenAI.Chat.Completions.ChatCompletionMessageParam;

export interface extensionState {
    ui: {
        chatSelectionIndex: number,
        buildSelectionIndex: number
        interactionMode: InteractionMode
    },
    chatHistory: messageExtentedType[],
    buildHistory: messageExtentedType[]
}

export interface appendMessage {
    id: string,
    index: number,
    message: messageType
}

export const defaultExtensionState: extensionState = {
    ui: {
        chatSelectionIndex: -1,
        buildSelectionIndex: -1,
        interactionMode: InteractionMode.CHAT
    },
    chatHistory: [],
    buildHistory: []
}

export type incommingPayload<T> = basePayload<inTypeUnion> & { parameters: T };

export type outPayload<T> = basePayload<outTypeUnion> & { parameters: T };

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