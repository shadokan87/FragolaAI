import OpenAI from "openai";
import { PORTKEY_GATEWAY_URL } from "portkey-ai";
import { z } from "zod";

export interface Tool {
    fn: (...args: any[]) => Promise<any>,
    description: string,
    schema?: z.ZodSchema<any>
}

export type ToolMap = Map<string, Tool>;

export async function* recursiveAgent(openai: OpenAI, name: string, messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[], body: Omit<OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming, "messages">, toolMap: ToolMap) {
    const stream = await openai.chat.completions.create({ ...body, messages });
    for await (const chunk of stream) {
        yield chunk;
    }
}