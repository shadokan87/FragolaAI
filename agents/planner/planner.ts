import type OpenAI from "openai";

export async function agentPlanner(openai: OpenAI, messages: OpenAI.ChatCompletionMessageParam[]) {
    const response = await openai?.chat.completions.create({
        model: "meta-llama/llama-3.1-70b-instruct:free",
        messages: messages,
        // tools: tools,
        tool_choice: "required",
        temperature: 0.1
    });
    return response;
}