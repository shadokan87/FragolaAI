import { parentPort, workerData } from 'worker_threads';
import OpenAI from 'openai';
import { basePayload } from '../types';

export type ChatWorkerPayload = {
    type: "chatRequest",
    data: {
        prompt: string
    }
} & basePayload;

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
            const stream = await openai.chat.completions.create({
                model: "meta-llama/llama-3.1-70b-instruct:free",
                messages: [{ role: "user", content: data.prompt }],
                stream: true,
            });
            for await (const chunk of stream) {
                parentPort?.postMessage({
                    type: "Chunck", data: chunk, id
                });
            }
            parentPort?.postMessage({
                type: "Chunck", data: "__END__", id
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

