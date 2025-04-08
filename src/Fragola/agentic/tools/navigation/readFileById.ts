import { z } from "zod";
import { IdToPath } from "../../../vscode/tree";
import { TextFileSync } from "lowdb/node";
import { ToolInfo, ToolType } from "@types";

export const readFileByIdToolInfo: ToolInfo = {
    name: "readFileById",
    description: "Use this tool to get the content of a file in the project"
}

export const readFileByIdSchema = z.object({
    id: z.string().describe("The id of the file to inspect. returns the content of the file")
});

export function readFileById(params: z.infer<typeof readFileByIdSchema>, idToPath: IdToPath ) {
    const path = idToPath.get(params.id);
    if (!path)
        return `No file with id ${params.id} seem exist.`;
    const textFile = new TextFileSync(path).read();
    if (!textFile)
        return `The file with id ${params.id} exist but failed to open`;
    return textFile;
}