/// <reference lib="webworker" />

export type ChatWorkerData = {
    type: "chatRequest",
    data: {
        prompt: string
    }
}

onmessage = async (event: MessageEvent) => {
    const message = event.data;

    // Process the message
    console.log("Worker received:", message);

    const {type, data}: ChatWorkerData = event.data;
    switch (type) {
        case 'chatRequest': {

        }
        default: {
            postMessage({type: "Error", code: 500, message: `type: ${type} not handled`});
        }
    }

    // Example: Send a message back to the main thread
    postMessage("Worker processed the message.");
};
