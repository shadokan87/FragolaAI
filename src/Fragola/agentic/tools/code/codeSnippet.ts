import { ToolInfo } from "@types";
import { z } from "zod";

export const codeGenToolInfo: ToolInfo = {
    name: "codeGen",
    description: "Use this tool to create or update a document in the project"
}

export const codeGenSchema = z.object({
    task: z.object({
        taskId: z.string(),
        groupId: z.string()
    }).optional().describe("Fill in the groupId and taskId if generating code for planned task. Leave empty otherwise"),
    path: z.string().describe("Relative path of file for CREATE actions, id of existing file for UPDATE. Leave empty for SHELL actions").optional(),
    sourceCode: z.string().describe("The source code of the file or the content of command for SHELL actions"),
    lang: z.string().describe("The language of code generated"),
    actionType: z.enum(["CREATE", "UPDATE", "SHELL"])
});

export function codeGen(params: z.infer<typeof codeGenSchema>) {
    return "SUCCESS"   
}