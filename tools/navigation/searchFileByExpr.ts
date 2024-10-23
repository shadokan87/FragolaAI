import { $ } from "bun";
import { z } from "zod";
import { config, toolManager } from "../../main";
import { services } from "../../services";
import { fileIdToPath } from "../../services/treeService";
import type { toolIdentity } from "../toolManager";

export const searchFileByExprSchema = z.object({
  expr: z.string().describe("a pattern to search, can be used with wildcards")
}).describe('returns an array of file id');

export async function searchFileByExpr({expr}: z.infer<typeof searchFileByExprSchema>) {
    const projectRoot = config.projectRoot || process.cwd();
    if (fileIdToPath.size == 0)
      await services.tree?.list();
    let command = ['rg', '-g', expr, '--files', projectRoot];
    const results: number[] = [];
  
    try {
      const output = await $`${command}`.nothrow().quiet();
      if (output.exitCode != 0) {
        if (output.exitCode == 1)
          return "The search ran successfully but found 0 match";
        throw new Error("Non zero exit code");
      }
      const split = output.text().split('\n').filter(str => str.length > 0);
      split.forEach(path => {
        const fileId = Array.from(fileIdToPath.entries()).find(([id, p]) => p === path)?.[0];
        if (fileId === undefined)
          throw new Error(`File ID not found for path: ${path}`);
        results.push(fileId);
      });
      console.log("!output", output.text());
    } catch(e) {
      console.error(e);
    }
    return JSON.stringify(results);
}

export const searchFileByExprIdentity: toolIdentity = {
  familly: "navigation",
  name: "searchFileByExpr",
  description: "Use to fuzzy find any file in the codebase where the name matches an expression. The expression can be a simple string or contain wildcards. This expression is the exact same parameter as ripgrep executable",
}