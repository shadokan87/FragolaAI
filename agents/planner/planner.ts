import OpenAI from "openai";
import zodToJsonSchema from "zod-to-json-schema";
import { toolManager } from "../../main";

export async function agentPlanner(openai: OpenAI, messages: OpenAI.ChatCompletionMessageParam[]) {
    const tools = toolManager.getToolByFamilly("navigation")
        .concat(toolManager.getToolByFamilly("planning"));

    const formated: OpenAI.Chat.Completions.ChatCompletionTool[] = tools.map((tool) => {
        return {
            type: "function",
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.schema && zodToJsonSchema(tool.schema) || undefined
            }
        }
    });
    let msg: OpenAI.ChatCompletionMessageParam[] = [...messages];
    const tmp = msg[0].content;

    msg[0].content = `You have access to the following tools:
    ${JSON.stringify(formated)}
You must always select one of the above tools and respond with only a JSON object matching the following schema:
{{
  "tool": <name of the selected tool>,
  "tool_input": <parameters for the selected tool, matching the tool's JSON schema>
}}
  ${tmp}
  `
        ;
    return await openai?.chat.completions.create({
        model: "meta-llama/llama-3.1-70b-instruct:free",
        messages: messages,
        // tools: formated,
        tool_choice: "required",
        temperature: 0.2
    })
    // console.log(JSON.stringify(formated, null, 2));
    // return "";
    // tools.push()
    // const response = await openai?.chat.completions.create({
    //     model: "meta-llama/llama-3.1-70b-instruct:free",
    //     messages: messages,
    //     // tools: toolManager.
    //     tool_choice: "required",
    //     temperature: 0.1
    // });
    // return response;
}