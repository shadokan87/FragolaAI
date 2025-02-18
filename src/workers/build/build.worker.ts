import { parentPort } from 'worker_threads';
import { basePayload, END_SENTINEL, outTypeUnion } from '../types.ts';
import { ExtensionState, MessageType, Prompt, ToolType } from "@types";
import { OpenAI } from "openai";
import { createHeaders, PORTKEY_GATEWAY_URL } from 'portkey-ai'
import recursiveAgent, { OnStreamCallback, OnToolCallMessageCallback, ToolMap } from "../../Fragola/agentic/recursiveAgent.ts";
import { streamChunkToMessage } from '@utils';

export type BuildWorkerPayload = {
    data: {
        prompt: Prompt,
        messages?: MessageType[],
        conversationId: ExtensionState['workspace']['ui']['conversationId'],
        build?: {
            tools: ToolType[],
            toolMap: ToolMap
        }
    }
} & basePayload<outTypeUnion>;

if (!parentPort) {
    throw new Error('This file must be run as a worker');
}

parentPort.on('message', async (message: BuildWorkerPayload) => {
    const openai = new OpenAI({
        apiKey: 'xxx',
        baseURL: PORTKEY_GATEWAY_URL,
        defaultHeaders: createHeaders({
            virtualKey: process.env["BEDROCK_DEV"],
            apiKey: process.env["PORTKEY_API_KEY"]
        })
    });

    console.log("Build Worker Message_: ", JSON.stringify(message.data.build));
    const { type, data, id }: BuildWorkerPayload = message;
    switch (type) {
        case 'chatRequest': {
            if (!data.messages || !data.messages.length) {
                parentPort?.postMessage({
                    type: END_SENTINEL, data: {}, id
                });
                parentPort?.postMessage({ type: "Error", code: 500, message: `empty messages` });
                parentPort?.close();
                //TODO: better error handling
                return;
            }
            let newMessages: Partial<MessageType>[] = [];

            const onStream: OnStreamCallback = (async stream => {
                newMessages.push({});
                for await (const chunk of stream) {
                    newMessages[newMessages.length - 1] = streamChunkToMessage(chunk, newMessages[newMessages.length - 1]);
                    console.log("__NEW_MESSAGE__", newMessages);
                    parentPort?.postMessage({
                        type: "chunk", data: newMessages, id
                    });
                    console.log(newMessages);
                }
                return newMessages.at(-1) as MessageType;
            });

            const onToolCallAnswered: OnToolCallMessageCallback = (message) => {
                newMessages.push(message);
            }

            const onFinish = () => {
                parentPort?.postMessage({
                    type: END_SENTINEL, data: {}, id
                });
                parentPort?.close();
            }

            await recursiveAgent(openai, "build", data.messages, {
                stream: true,
                model: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
                tools: data.build?.tools,
                tool_choice: "auto"
            }, new Map(), onStream, onToolCallAnswered, onFinish);
        }
        default: {
            parentPort?.postMessage({ type: "Error", code: 500, message: `type: ${type} not handled` });
            break;
        }
    };
});