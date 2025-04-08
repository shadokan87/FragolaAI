import type OpenAI from "openai";
import { FragolaClient } from "../src/Fragola/Fragola";
import { basePayload, inTypeUnion, outTypeUnion } from "../src/workers/types";
import { CompletionResponseChunk, ChatCompletionMessageParam, ChatCompletionTool } from "@shadokan87/token.js";
import { TreeResult, TreeService } from "../src/services/treeService";
import { ChatCompletionCreateParamsBase, ChatCompletionMessageToolCall } from "openai/resources/chat/completions";

export const NONE_SENTINEL = "<NONE>";

export type chunkType = OpenAI.Chat.Completions.ChatCompletionChunk

export enum InteractionMode {
    CHAT = "CHAT",
    BUILD = "BUILD",
    PLAN = "PLAN"
}

export enum MentionKind {
    FILE = "FILE",
    FOLDER = "FOLDER"
}

export interface userMessageMetaData {
    prompt: Prompt,
    interactionMode: InteractionMode,
    planGroupId?: string
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

export type MessageExtendedType = MessageType & { meta?: userMessageMetaData };

export type MessageType = OpenAI.Chat.ChatCompletionMessageParam;

export type ToolMessageType = OpenAI.Chat.Completions.ChatCompletionToolMessageParam;

export type ToolType =  OpenAI.Chat.Completions.ChatCompletionTool;

export type ToolCallType = ChatCompletionMessageToolCall; 

export type ToolInfo = Pick<Required<ToolType["function"]>, "name" | "description">;

export type Tree = Awaited<ReturnType<TreeService['list']>>

export interface ExtensionState {
    workspace: {
        ui: {
            conversationId: HistoryIndex["id"],
            interactionMode: InteractionMode,
            showHistory: boolean,
        },
        historyIndex: HistoryIndex[],
        messages: MessageExtendedType[],
        streamState: "NONE" | "AWAITING" | "STREAMING",
        tree?: TreeResult
    }, global: {

    }
};

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
    export namespace ui {
        export type changeInteractionMode = outPayload<{
            mode: InteractionMode
        }>;
    }
}