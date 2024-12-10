import { parentPort, workerData } from 'worker_threads';
import { basePayload, END_SENTINEL, outTypeUnion } from '../types.ts';
import { FragolaClient } from "../../Fragola/Fragola.ts";
import { chunckType } from '@types';
import { receiveStreamChunk } from "@utils";
import OpenAI, { AzureOpenAI } from 'openai';
import axios from 'axios';

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
            const stream = await axios.post("http://localhost:3000/chat/completions", {
                messages: [{ role: "user", content: data.prompt }]
            }, {
                responseType: 'stream'
            });
            let fullMessage: Partial<chunckType> = {};
            let buffer = '';
            for await (const chunk of stream.data) {
                buffer += chunk.toString('utf-8');
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer
                
                for (const line of lines) {
                    if (!line) continue;
                    try {
                        const parsedChunk: chunckType = JSON.parse(line);
                        fullMessage = receiveStreamChunk(fullMessage, parsedChunk);
                        parentPort?.postMessage({
                            type: "chunk", data: parsedChunk, id
                        });
                    } catch (error) {
                        console.error('Error parsing chunk:', line, error);
                    }
                }
            }
            console.log("__FULL__", JSON.stringify(fullMessage));
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