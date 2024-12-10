import { chunkType, messageType } from "@types";
import OpenAI from "openai";

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

export const streamChunkToMessage = (chunk: chunkType, message: Partial<messageType> = {} as Partial<messageType>) => {
    let updatedMessage = structuredClone(message);
    if (chunk.choices[0].delta.role) {
        updatedMessage.role = chunk.choices[0].delta.role;
    }
    updatedMessage.content = (message.content || '') + (chunk.choices[0].delta.content || '');
    return updatedMessage;
}


// const test: OpenAI.Chat.Completions.ChatCompletion[] = []