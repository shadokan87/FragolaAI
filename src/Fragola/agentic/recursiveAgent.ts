import { MessageType } from "@types";
import OpenAI from "openai";
import { ChatCompletionChunk } from "openai/resources";
import { Stream } from "openai/streaming";
import { PORTKEY_GATEWAY_URL } from "portkey-ai";
import { z } from "zod";

export interface Tool {
    fn: (...args: any[]) => Promise<any>,
    description: string,
    schema?: z.ZodSchema<any>
}

export type ToolMap = Map<string, Tool>;

export default async function recursiveAgent(openai: OpenAI, name: string, messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[], body: Omit<OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming, "messages">, toolMap: ToolMap, onStream: (stream: Stream<OpenAI.Chat.Completions.ChatCompletionChunk> & {
    _request_id?: string | null;
},) => void, onFinish: () => void) {
    let fullMessage: Partial<MessageType> = {};
    const stream = await openai.chat.completions.create({ ...body, messages });
    onStream(stream);
    onFinish();

    // return stream();
}