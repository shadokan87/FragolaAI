import type OpenAI from "openai";
import { FragolaClient } from "../src/Fragola/Fragola";
import { basePayload, inTypeUnion, outTypeUnion } from "../src/workers/types";
import { CompletionResponseChunk, ChatCompletionMessageParam } from "@shadokan87/token.js";
import { TreeResult, TreeService } from "../src/services/treeService";

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

export type PartialMention = Partial<Mention & { stream?: boolean, kindParsed?: boolean}>;

export type Prompt = (string | Mention)[];

export type PartialPrompt = (string | PartialMention)[];

export type MessageExtendedType = MessageType & { meta: userMessageMetaData };

export type MessageType = ChatCompletionMessageParam;

export type Tree = Awaited<ReturnType<TreeService['list']>>

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
        tree?: TreeResult
        // tree: Awaited<ReturnType<>>
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
    export namespace action {

        export type conversationClick = outPayload<{
            conversationId: ConversationId
        }>;
        export type deleteConversation = outPayload<{
            conversationId: ConversationId
        }>;
    }
}