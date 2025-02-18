import { ChatCompletionMessageToolCall } from "openai/resources";
import { chunkType, ExtensionState, InteractionMode, MessageType } from "./types";
import { NONE_SENTINEL } from "./types";
import { BehaviorSubject } from "rxjs";
import _ from "lodash";

export const receiveStreamChunk = (message: Partial<chunkType>, chunk: chunkType) => {
    let updatedMessage = structuredClone(message);
    updatedMessage = {
        ...chunk, choices: chunk.choices.map((choice, index) => ({
            ...choice,
            delta: {
                role: choice.delta.role || message.choices?.[index]?.delta?.role,
                content: (message.choices?.[index]?.delta?.content || '') + (choice.delta.content || '')
            },
        }))
    }
    return updatedMessage;
}

export const streamChunkToMessage = (chunk: chunkType, message: Partial<MessageType> = {} as Partial<MessageType>) => {
    let updatedMessage = structuredClone(message);

    // Handle role if present in delta
    if (chunk.choices[0].delta?.role) {
        updatedMessage.role = chunk.choices[0].delta.role;
    }

    // Handle content if present in delta
    if (chunk.choices[0].delta?.content) {
        updatedMessage.content = (message.content || '') + chunk.choices[0].delta.content;
    }

    // Handle tool_calls if present in delta
    if (chunk.choices[0].delta?.tool_calls && updatedMessage.role === "assistant") {
        if (!updatedMessage.tool_calls)
            updatedMessage.tool_calls = [];
        const toolCall = chunk.choices[0].delta.tool_calls.at(-1);
        if (toolCall) {
            if (toolCall.id) {
                updatedMessage.tool_calls.push({
                    id: toolCall.id,
                    type: "function",
                    function: {
                        name: toolCall.function?.name || "",
                        arguments: toolCall.function?.arguments || ""
                    },
                })
            } else {
                let lastToolCallRef = updatedMessage.tool_calls.at(-1);
                if (lastToolCallRef && lastToolCallRef.function && toolCall.function?.arguments) {
                    lastToolCallRef.function = {
                        ...lastToolCallRef.function,
                        arguments: lastToolCallRef.function.arguments + toolCall.function.arguments
                    }
                }
            }
        }
    }

    return updatedMessage;
}

export const defaultExtensionState: ExtensionState = Object.freeze({
    workspace: {
        ui: {
            conversationId: NONE_SENTINEL,
            interactionMode: InteractionMode.CHAT,
            showHistory: false,
        },
        historyIndex: [],
        messages: [],
        streamState: "NONE" as const,
    },
    global: {

    }
})

export class Mutex {
    private locked: boolean = false;
    private queue: (() => void)[] = [];

    async acquire(): Promise<void> {
        return new Promise<void>((resolve) => {
            if (!this.locked) {
                this.locked = true;
                resolve();
            } else {
                this.queue.push(resolve);
            }
        });
    }

    release(): void {
        if (this.queue.length > 0) {
            const nextResolve = this.queue.shift();
            if (nextResolve) nextResolve();
        } else {
            this.locked = false;
        }
    }
}

// export function updateExtensionStateMiddleware(prev: ExtensionState, newValue: ExtensionState): ExtensionState {
//     let _newValue = structuredClone(newValue);
//     // if (prev.workspace.isConversationTmp && _newValue.workspace.messages.length)
//     //     _newValue.workspace.isConversationTmp = false
//     return _newValue;
// }

// export function createUpdateState<T>(middleware: (prev: T, newValue: T) => T): (state$: BehaviorSubject<T>, callback: (prev: T) => T) => void {
//     return (state$, callback) => {
//         const prevState = state$.getValue();
//         const newState = callback(prevState);
//         state$.next(middleware(prevState, newState));
//     }
// }

// export const updateExtensionState = createUpdateState<ExtensionState>(updateExtensionStateMiddleware);