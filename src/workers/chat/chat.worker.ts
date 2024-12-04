import { parentPort, workerData } from 'worker_threads';
import { basePayload, END_SENTINEL, outTypeUnion } from '../types.ts';
import { FragolaClient } from "../../Fragola/Fragola.ts";
import { chunckType } from '@types';
import { receiveStreamChunk } from "@utils";
import { AzureOpenAI } from 'openai';

export type ChatWorkerPayload = {
    data: {
        prompt: string,
        loadedLength: number
    }
} & basePayload<outTypeUnion>;


if (!parentPort) {
    throw new Error('This file must be run as a worker');
}
// caonsole.log("!env", process.env);
const model = "gpt-4o-mini";
const azureOpenAiEndpoint = (model: string) => `https://ai-eclipsetoure3139ai863411562242.openai.azure.com/openai/deployments/${model}/chat/completions?api-version=2024-08-01-preview`
const openai = new AzureOpenAI({
    baseURL: azureOpenAiEndpoint(model),
    apiKey: process.env['OPENAI_API_KEY'],
    apiVersion: "2024-08-01-preview"
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
                model,
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