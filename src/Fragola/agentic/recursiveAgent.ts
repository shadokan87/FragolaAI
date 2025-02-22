import { MessageType, ToolMessageType, ToolType } from "@types";
import OpenAI from "openai";
import { ChatCompletionChunk } from "openai/resources";
import { Stream } from "openai/streaming";
import { PORTKEY_GATEWAY_URL } from "portkey-ai";
import { z } from "zod";
import { ToolUnexpectedError } from "../exceptions/ToolUnexpectedError";

export interface Tool {
    fn: (parameters: any) => Promise<string>,
    description: string,
    schema?: z.ZodSchema<any>
}

export type ToolMap = Map<string, Tool>;

export type OnStreamCallback = (stream: Stream<OpenAI.Chat.Completions.ChatCompletionChunk> & {
    _request_id?: string | null;
},) => Promise<MessageType>;

export type OnToolCallMessageCallback = (message: MessageType) => void;
let iter = 0;
export default async function recursiveAgent(openai: OpenAI,
    name: string,
    messages: MessageType[],
    body: Omit<OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming, "messages">,
    toolMap: ToolMap,
    onStream: OnStreamCallback,
    onToolCallMessageCallback: OnToolCallMessageCallback,
    onFinish: (toolCalls?: ToolType[]) => void
) {
    iter++;
    if (iter == 20) {
        console.error("__TOOL_MAX_ITER__");
        return onFinish();
    }
    const stream = await openai.chat.completions.create({ ...body, messages });
    const newMessage = await onStream(stream);
    let newMessages: MessageType[] = [newMessage];

    if (newMessage.role == "assistant" && newMessage.tool_calls && newMessage.tool_calls.length) {
        await Promise.all(newMessage.tool_calls.map(async toolCall => {
            const tool = toolMap.get(toolCall.function.name);
            if (!tool) {
                console.error(`Tool with name ${toolCall.function.name} not found`);
                return;
            }

            let paramsParsed: z.SafeParseReturnType<any, any> | undefined;
            if (tool.schema) {
                paramsParsed = tool.schema.safeParse(JSON.parse(toolCall.function.arguments));
                if (!paramsParsed.success) {
                    throw new ToolUnexpectedError(`Zod parsing fail`, toolCall.function.name);
                }
            }

            const content = await tool.fn(paramsParsed?.data);
            const message: ToolMessageType = {
                role: "tool",
                content,
                tool_call_id: toolCall.id
            };

            onToolCallMessageCallback(message);
            newMessages.push(message);
        }));
        return await recursiveAgent(openai, name, [...messages, ...newMessages], body, toolMap, onStream, onToolCallMessageCallback, onFinish);
    }
    return onFinish();
}