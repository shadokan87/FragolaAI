import { ToolInfo } from "@types";
import { z } from "zod";

export const createSubTaskInfo: ToolInfo = {
    name: "createSubTask",
    description: "Use this tool to add a sub task"
}

export const createSubTaskSchema = z.object({
    operation: z.enum(["UPDATE", "CREATE", "DELETE", "SHELL"]),
    path: z.string().describe("id of file if exist or path for project file operations. The exact command for SHELL operations."),
    description: z.string().describe("the description following the instructions guidlines")
}).describe("Returns the id of the task group and the individual task id like so: groupId=<id>:taskId=<id>");

// export const createSubTaskRuntimeSchema = z.object({
//     operation: z.enum(["UPDATE", "CREATE", "DELETE", "SHELL"]),
//     path: z.string().describe("id of file if exist or path for project file operations. The exact command for SHELL operations."),
//     description: z.string().describe("the description following the instructions guidlines"),
//     runtime: z.object({
//         groupId: z.number(),
//         taskId: z.number(),
//         state: z.enum(["NONE", "GENERATING", "SUCCESS", "FAIL"])
//     })
// });

export function createSubTask(params: z.infer<typeof createSubTaskSchema>) {
    // console.log("task: ", params);
    // return `Task added successfull`;
}