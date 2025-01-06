import { parentPort, workerData } from 'worker_threads';
import { basePayload, END_SENTINEL, outTypeUnion } from '../types.ts';
import { chunkType } from "@types";
import { receiveStreamChunk } from "@utils";

export type ChatWorkerPayload = {
    data: {
        prompt: string,
        loadedLength: number
    }
} & basePayload<outTypeUnion>;


if (!parentPort) {
    throw new Error('This file must be run as a worker');
}

parentPort.on('message', async (message: ChatWorkerPayload) => {
    console.log("#br3");
    const TokenJS = (await import("@shadokan87/token.js")).TokenJS;

    const tokenjs = new TokenJS().extendModelList("bedrock", 'us.anthropic.claude-3-5-sonnet-20241022-v2:0', "anthropic.claude-3-sonnet-20240229-v1:0");

    // Process the message
    console.log("Worker received:", message);
    const { type, data, id }: ChatWorkerPayload = message;
    switch (type) {
        case 'chatRequest': {
            let fullMessage: Partial<chunkType> = {};
            const stream = await tokenjs.chat.completions.create({
                stream: true,
                provider: 'bedrock',
                model: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0' as any,
                // Define your message
                messages: [
                    {
                        role: 'user',
                        content: data.prompt,
                    },
                ],
            });
            for await (const chunk of stream) {
                fullMessage = receiveStreamChunk(fullMessage, chunk);
                parentPort?.postMessage({
                    type: "chunk", data: chunk, id
                });
            }
            parentPort?.postMessage({
                type: END_SENTINEL, data: fullMessage, id
            });
            parentPort?.close();
            // break;
        }
        default: {
            parentPort?.postMessage({ type: "Error", code: 500, message: `type: ${type} not handled` });
            break;
        }
    };
});