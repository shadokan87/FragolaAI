import { z } from "zod";
import { IdToPath } from "../../../vscode/tree";
import { TextFileSync } from "lowdb/node";

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