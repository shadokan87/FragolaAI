import { z } from "zod";
import type { toolIdentity } from "../toolManager";

export const codeGenTaskSchema = z.object({
    path: z.string(),
    description: z.string(),
    codeGeneration: z.object({
        prompt: z.string(),
        pathDependencies: z.array(z.string())
    }),
    type: z.enum(["create", "update", "delete", "command"]),
});

export const codeGenTaskIdentity: toolIdentity = {
    familly: "planning",
    name: "createCodeGenerationTask",
    description: "push a new code generation task to the queue",
}