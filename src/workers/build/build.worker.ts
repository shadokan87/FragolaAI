import { parentPort } from 'worker_threads';
import { basePayload, END_SENTINEL, outTypeUnion } from '../types.ts';
import { ExtensionState, MessageType, Prompt, ToolType } from "@types";

export type BuildWorkerPayload = {
    data: {
        prompt: Prompt,
        messages?: MessageType[],
        conversationId: ExtensionState['workspace']['ui']['conversationId'],
        build?: {
            tools: ToolType[]
        }
    }
} & basePayload<outTypeUnion>;

if (!parentPort) {
    throw new Error('This file must be run as a worker');
}

parentPort.on('message', async (message: BuildWorkerPayload) => {
    const TokenJS = (await import("@shadokan87/token.js")).TokenJS;
    const tokenjs = new TokenJS().extendModelList("bedrock", 'us.anthropic.claude-3-5-sonnet-20241022-v2:0', "anthropic.claude-3-sonnet-20240229-v1:0")
        .extendModelList("bedrock", "us.anthropic.claude-3-5-haiku-20241022-v1:0", "anthropic.claude-3-5-haiku-20241022-v1:0");

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
                return ;
            }
            const stream = await tokenjs.chat.completions.create({
                stream: true,
                provider: 'bedrock',
                model: 'us.anthropic.claude-3-5-haiku-20241022-v1:0' as any,
                messages: data.messages,
                tools: data.build?.tools,
                tool_choice: "auto"
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