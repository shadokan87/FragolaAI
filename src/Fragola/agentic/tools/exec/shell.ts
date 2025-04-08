import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import { ToolInfo } from "@types";

export const shellToolInfo: ToolInfo = {
    name: "shell",
    description: "Use this tool to execute shell commands"
}

export const shellSchema = z.object({
    command: z.string().describe("The shell command to execute")
});

const execAsync = promisify(exec);

export async function shell(params: z.infer<typeof shellSchema>) {
    return "command executed successfully";
    // try {
    //     const { stdout, stderr } = await execAsync(params.command);
    //     if (stderr) {
    //         return `Error: ${stderr}`;
    //     }
    //     return stdout;
    // } catch (error) {
    //     return `Error executing command: ${error.message}`;
    // }
}
