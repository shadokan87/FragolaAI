import type OpenAI from "openai";
import { FragolaClient } from "../src/Fragola/Fragola";
import { basePayload, inTypeUnion, outTypeUnion } from "../src/workers/types";
import { CompletionResponseChunk, ChatCompletionMessageParam } from "@shadokan87/token.js";

export const NONE_SENTINEL = "<NONE>";

export type chunkType = CompletionResponseChunk;

export enum InteractionMode {
    CHAT = "CHAT",
    BUILD = "BUILD"
}

export enum MentionKind {
    FILE = "FILE",
    FOLDER = "FOLDER"
}

export interface userMessageMetaData {
    prompt: Prompt,
    interactionMode: InteractionMode,
}

export interface conversationMetaData {
    label: string | undefined,
    createdAt: string
}

export type HistoryIndex = {
    id: string,
    meta: conversationMetaData
}

export type Mention = {
    kind: MentionKind,
    content: string
}

export type Prompt = (string | Mention)[];

export type MessageExtendedType = MessageType & { meta: userMessageMetaData };

export type MessageType = ChatCompletionMessageParam;

export interface ExtensionState {
    workspace: {
        ui: {
            conversationId: HistoryIndex["id"],
            interactionMode: InteractionMode,
            showHistory: boolean
        },
        historyIndex: HistoryIndex[],
        messages: MessageType[],
        streamState: "NONE" | "AWAITING" | "STREAMING",
        // updateEvent?: "MESSAGE_CREATE" | "MESSAGE_PUSH" | "MESSAGE_LAST_UPDATE" | "MESSAGE_POP"
    }, global: {

    }
}

export type ConversationId = ExtensionState["workspace"]["ui"]["conversationId"];

export type WorkspaceKeys = keyof ExtensionState['workspace'];

export type GlobalKeys = keyof ExtensionState['global'];

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