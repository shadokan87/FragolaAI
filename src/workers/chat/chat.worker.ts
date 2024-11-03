import { parentPort, workerData } from 'worker_threads';

export type ChatWorkerPayload = {
    type: "chatRequest",
    data: {
        prompt: string
    }
}

if (!parentPort) {
    throw new Error('This file must be run as a worker');
}

parentPort.on('message', (message: ChatWorkerPayload) => {
    console.log("#br3");

    // Process the message
    console.log("Worker received:", message);
    const { type, data }: ChatWorkerPayload = message;
    switch (type) {
        case 'chatRequest': {
            parentPort?.postMessage({
                type: "Chunck", data: {
                    role: "assistant",
                    content: data.prompt
                }
            });
            break;
        }
        default: {
            parentPort?.postMessage({ type: "Error", code: 500, message: `type: ${type} not handled` });
            break;
        }
    };
});

