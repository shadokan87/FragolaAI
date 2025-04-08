import { parentPort } from 'worker_threads';
import { basePayload, END_SENTINEL, outTypeUnion } from '../types.ts';
import { ExtensionState, MessageType, Prompt, ToolType } from "@types";
import { OpenAI } from "openai";
import { createHeaders, PORTKEY_GATEWAY_URL } from 'portkey-ai'
import recursiveAgent, { OnStreamCallback, OnToolCallMessageCallback, ToolMap } from "../../Fragola/agentic/recursiveAgent.ts";
import { streamChunkToMessage } from '@utils';
import { grepCodeBaseToolInfo, grepCodeBaseSchema, grepCodebase } from "../../Fragola/agentic/tools/navigation/grepCodebase.ts"
import { readFileById, readFileByIdSchema, readFileByIdToolInfo } from "../../Fragola/agentic/tools/navigation/readFileById.ts";
import {createSubTaskInfo, createSubTask, createSubTaskSchema} from "../../Fragola/agentic/tools/plan/createTask.ts";
import { _getIdFromPath, IdToPath } from '../../Fragola/vscode/tree.ts';
import z from 'zod';

export type BuildWorkerPayload = {
    data: {
        prompt: Prompt,
        messages?: MessageType[],
        conversationId: ExtensionState['workspace']['ui']['conversationId'],
        runtimeSerialized: {
            projectRoot: string,
            idToPath: IdToPath
        },
        build?: {
            tools: ToolType[],
        }
    }
} & basePayload<outTypeUnion>;

if (!parentPort)
    throw new Error('This file must be run as a worker');

parentPort.on('message', async (message: BuildWorkerPayload) => {
    console.log("GOOGLE_ACCESS_TOKEN", process.env["GOOGLE_ACCESS_TOKEN"])
    const { nanoid } = await import('nanoid');
    const openai = new OpenAI({
        apiKey: process.env["GOOGLE_ACCESS_TOKEN"],
        baseURL: PORTKEY_GATEWAY_URL,
        defaultHeaders: createHeaders({
            virtualKey: process.env["GOOGLE_VIRUTAL_KEY"],
            apiKey: process.env["PORTKEY_API_KEY"]
        })
    });

    const { runtimeSerialized } = message.data;
    const groupId = nanoid();

    const toolMap: ToolMap = new Map([
        [grepCodeBaseToolInfo.name, {
            description: grepCodeBaseToolInfo.description,
            schema: grepCodeBaseSchema,
            fn: async (parameters) => {
                const parametersInfered = parameters as z.infer<typeof grepCodeBaseSchema>;
                return grepCodebase(message.data.runtimeSerialized.projectRoot, parametersInfered, (stdout) => {
                    const matchSplit = stdout.split("\n");
                    let processedResult: string[] = [];
                    matchSplit.forEach((match) => {
                        const split = match.split(":").filter(chunk => chunk.trim() != "");
                        if (split.length == 2) {
                            const id = _getIdFromPath(runtimeSerialized.idToPath, split[0]);
                            processedResult.push(`${id}:${split[1]}`);
                        }
                    });
                    return processedResult.join("\n");
                });
            }
        }],
        [readFileByIdToolInfo.name, {
            description: readFileByIdToolInfo.description,
            schema: readFileByIdSchema,
            fn: async (parameters) => {
                const parametersInfered = parameters as z.infer<typeof readFileByIdSchema>;
                return readFileById(parametersInfered, runtimeSerialized.idToPath);
            }
        }],
        [createSubTaskInfo.name, {
            description: createSubTaskInfo.description,
            schema: createSubTaskSchema,
            fn: async (parameters) => {
                const parametersInfered = parameters as z.infer<typeof createSubTaskSchema>;
                return "SUCCESS";
                // return `groupId=${groupId}:taskId=${nanoid()}`
            }
        }]
    ])

    console.log("Plan Worker Message_: ", JSON.stringify(message.data.build));
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
                let completedMessage = newMessages.at(-1) as MessageType;
                if (completedMessage.role == "assistant" && "tool_calls" in completedMessage && completedMessage.tool_calls?.length) {
                    for (let i = 0; i < completedMessage.tool_calls?.length; i++) {
                        if (completedMessage.tool_calls[i].function.name == createSubTaskInfo.name) {
                            let args: z.infer<typeof createSubTaskSchema> = JSON.parse(completedMessage.tool_calls[i].function.arguments);
                            args.groupId = groupId;
                            args.taskId = nanoid();
                            completedMessage.tool_calls[i].function.arguments = JSON.stringify(args);
                        }
                    }
                }
                return newMessages.at(-1) as MessageType;
            });

            const onToolCallAnswered: OnToolCallMessageCallback = (message) => {
                newMessages.push(message);
            }

            const onFinish = () => {
                console.log("OnFinish(): ", newMessages);
                parentPort?.postMessage({
                    type: END_SENTINEL, data: {}, id
                });
                parentPort?.close();
            }
            try {
                await recursiveAgent(openai, "build", data.messages, {
                    stream: true,
                    model: "anthropic.claude-3-5-sonnet-v2@20241022",
                    max_tokens: 5000,
                    tools: data.build?.tools,
                    tool_choice: "auto"
                }, toolMap, onStream, onToolCallAnswered, onFinish);
            } catch (e) {
                console.error("AGENT_ERROR", e);
            }
        }
        default: {
            parentPort?.postMessage({ type: "Error", code: 500, message: `type: ${type} not handled` });
            break;
        }
    };
});