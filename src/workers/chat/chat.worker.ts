import { parentPort, workerData } from 'worker_threads';
import OpenAI from 'openai';
import { basePayload, END_SENTINEL, outTypeUnion } from '../types.ts';
import { FragolaClient } from "../../Fragola/Fragola.ts";
import { chunckType } from '@types';
import { receiveStreamChunk } from "@utils";

export type ChatWorkerPayload = {
    data: {
        prompt: string
    }
} & basePayload<outTypeUnion>;


if (!parentPort) {
    throw new Error('This file must be run as a worker');
}

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY
});

parentPort.on('message', async (message: ChatWorkerPayload) => {
    console.log("#br3");

    // Process the message
    console.log("Worker received:", message);
    const { type, data, id }: ChatWorkerPayload = message;
    switch (type) {
        case 'chatRequest': {
            let message: Partial<chunckType> = {};
            const stream = await openai.chat.completions.create({
                model: "meta-llama/llama-3.1-70b-instruct:free",
                messages: [{ role: "user", content: data.prompt }],
                stream: true,
            });
            for await (const chunk of stream) {
                message = receiveStreamChunk(message, chunk);
                parentPort?.postMessage({
                    type: "chunck", data: chunk, id
                });
            }
            parentPort?.postMessage({
                type: END_SENTINEL, data: message, id
            });
            parentPort?.close();
            break;
        }
        default: {
            parentPort?.postMessage({ type: "Error", code: 500, message: `type: ${type} not handled` });
            break;
        }
    };
});