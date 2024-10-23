import { $ } from "bun";
import { z } from "zod";
import { NonZeroExitCode } from "../../exceptions/shell";
import { fileIdToPath } from "../../services/treeService";
import type { toolIdentity } from "../toolManager";

export const readFileByIdSchema = z.object({
    id: z.number().describe("The id of the file to inspect. returns the content of the file")
});

export async function readFileById({ id }: z.infer<typeof readFileByIdSchema>) {
    const path = fileIdToPath.get(id);
    if (!path)
      throw new Error(`No path found for file with id: ${id}`);
    try {
      const content = await $`cat ${path}`.quiet();
      //TODO: change t
      if (content.exitCode != 0)
        throw new NonZeroExitCode(`For file at path ${path}`);
      return content.text();
    } catch (e) {
      console.error(e);
      throw new Error(`Failed to read file at path $`)
    }
}

export const readFileByIdIdentity: toolIdentity = {
  familly: "navigation",
  name: "readFileById",
  description: "Use to read the content of a source code file by using his id from the custom field. It returns the entire content.",
}