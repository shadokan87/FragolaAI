import { chunkType, extensionState, InteractionMode, MessageType } from "./types";
import { NONE_SENTINEL } from "./types";
import { BehaviorSubject } from "rxjs";

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
    if (chunk.choices[0].delta.role) {
        updatedMessage.role = chunk.choices[0].delta.role;
    }
    updatedMessage.content = (message.content || '') + (chunk.choices[0].delta.content || '');
    return updatedMessage;
}

export const defaultExtensionState: extensionState = {
    workspace: {
        ui: {
            conversationId: NONE_SENTINEL,
            interactionMode: InteractionMode.CHAT
        },
        historyIndex: [],
        messages: [],
        isConversationTmp: true
    },
    global: {

    }
}

export function updateExtensionStateMiddleware(prev: extensionState, newValue: extensionState): extensionState {
    let _newValue = structuredClone(newValue);
    // if (prev.workspace.isConversationTmp && _newValue.workspace.messages.length)
    //     _newValue.workspace.isConversationTmp = false
    return _newValue;
}

export function createUpdateState<T>(middleware: (prev: T, newValue: T) => T): (state$: BehaviorSubject<T>, callback: (prev: T) => T) => void {
    return (state$, callback) => {
        const prevState = state$.getValue();
        const newState = callback(prevState);
        state$.next(middleware(prevState, newState));
    }
}

// export const updateExtensionState = createUpdateState<extensionState>(updateExtensionStateMiddleware);