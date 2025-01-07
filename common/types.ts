import type OpenAI from "openai";
import { FragolaClient } from "../src/Fragola/Fragola";
import { basePayload, inTypeUnion, outTypeUnion } from "../src/workers/types";
import { CompletionResponseChunk, ChatCompletionMessageParam } from "@shadokan87/token.js";

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
    interactionMode: InteractionMode,
    label: string
}

export type HistoryIndex = {
    id: string,
    meta: userMessageMetaData
}

export type Prompt = {
    text: string,
    meta?: Partial<userMessageMetaData>
}

export type MessageExtendedType = MessageType & userMessageMetaData;

export type MessageType = ChatCompletionMessageParam;

export interface extensionState {
    ui: {
        chatSelectionIndex: number,
        buildSelectionIndex: number
        interactionMode: InteractionMode
    },
    chatHistory: MessageType[],
    buildHistory: MessageType[]
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