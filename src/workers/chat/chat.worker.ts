/// <reference lib="webworker" />

export type ChatWorkerPayload = {
    type: "chatRequest",
    data: {
        prompt: string
    }
}

addEventListener('message', async (event) => {
    console.log("#br3");
    const message = event.data;

    // Process the message
    console.log("Worker received:", message);
    const { type, data }: ChatWorkerPayload = event.data;
    switch (type) {
        case 'chatRequest': {
            postMessage({
                type: "Chunck", data: {
                    role: "assistant",
                    content: data.prompt
                }
            })
            break;
        }
        default: {
            postMessage({ type: "Error", code: 500, message: `type: ${type} not handled` });
            break;
        }
    };
});

