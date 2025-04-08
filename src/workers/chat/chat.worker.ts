import { parentPort, workerData } from 'worker_threads';
import { basePayload, END_SENTINEL, outTypeUnion } from '../types.ts';
import { chunkType, ExtensionState, MessageType, Prompt } from "@types";
import { receiveStreamChunk } from "@utils";
import { createHeaders, PORTKEY_GATEWAY_URL } from 'portkey-ai';
import OpenAI from 'openai';

export type ChatWorkerPayload = {
    data: {
        prompt: Prompt,
        messages?: MessageType[],
        conversationId: ExtensionState['workspace']['ui']['conversationId']
    }
} & basePayload<outTypeUnion>;


if (!parentPort) {
    throw new Error('This file must be run as a worker');
}

parentPort.on('message', async (message: ChatWorkerPayload) => {
    const openai = new OpenAI({
      apiKey: 'xxx',
      baseURL: PORTKEY_GATEWAY_URL,
      defaultHeaders: createHeaders({
        virtualKey: process.env["BEDROCK_DEV"],
        apiKey: process.env["PORTKEY_API_KEY"]})
    });
    console.log("Worker received:", message);
    const { type, data, id }: ChatWorkerPayload = message;
    switch (type) {
        case 'chatRequest': {
            if (!data.messages || !data.messages.length) {
                parentPort?.postMessage({
                    type: END_SENTINEL, data: {}, id
                });
                parentPort?.postMessage({ type: "Error", code: 500, message: `empty messages` });
                parentPort?.close();
                //TODO: better error handling
                return ;
            }
            const stream = await openai.chat.completions.create({
                stream: true,
                model: 'us.anthropic.claude-3-5-haiku-20241022-v1:0' as any,
                messages: data.messages
            });
            for await (const chunk of stream) {
                parentPort?.postMessage({
                    type: "chunk", data: chunk, id
                });
            }
            parentPort?.postMessage({
                type: END_SENTINEL, data: {}, id
            });
            parentPort?.close();
        }
        default: {
            parentPort?.postMessage({ type: "Error", code: 500, message: `type: ${type} not handled` });
            break;
        }
    };
});