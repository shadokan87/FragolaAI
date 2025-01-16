import { parentPort, workerData } from 'worker_threads';
import { basePayload, END_SENTINEL, outTypeUnion } from '../types.ts';
import { chunkType, ExtensionState, Prompt } from "@types";
import { receiveStreamChunk } from "@utils";

export type ChatWorkerPayload = {
    data: {
        prompt: Prompt,
        conversationId: ExtensionState['workspace']['ui']['conversationId']
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
            const stream = await tokenjs.chat.completions.create({
                stream: true,
                provider: 'bedrock',
                model: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0' as any,
                // Define your message
                messages: [
                    {
                        role: 'user',
                        content: JSON.stringify(data.prompt),
                    },
                ],
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