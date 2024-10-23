import { $ } from "bun";
import { fileIdToPath } from "../../services/treeService";
import { z } from "zod";
import { config } from "../../main";
import { services } from "../../services";
import type { toolIdentity } from "../toolManager";

export const grepCodeBaseSchema = z.object({
    content: z.string().describe("the content to search for"),
    includeFile: z.string().describe("a pattern to include only a type of file before running the search").optional(),
    excludeFile: z.string().describe("a pattern to exclude a type of file before running the search").optional()
}).describe('returns an array of items formated like so \'<file_id>:<real_file_path>:match_count\'');

export async function grepCodeBase({ content, includeFile, excludeFile }: z.infer<typeof grepCodeBaseSchema>) {
    const projectRoot = config.projectRoot || process.cwd();
    if (fileIdToPath.size == 0)
        await services.tree?.list();

    let command = ['rg', '--json', '--no-line-number', '--count', '--ignore-case'];

    if (includeFile) {
        command.push('--glob', includeFile);
    }

    if (excludeFile) {
        command.push('--glob', `!${excludeFile}`);
    }

    command.push(content, projectRoot)

    const results: string[] = [];
    try {
        const output = await $`${command}`.nothrow().quiet();
        if (output.exitCode != 0) {
            if (output.exitCode == 1)
                return "The search ran successfully but found 0 match";
            throw new Error("Non zero exit code");
        }
        const split = output.text().split('\n').filter(str => str.length > 0);
        split.forEach(str => {
            const path = str.split(':').at(0);
            if (!path)
                throw new Error("Path undefined");
            const fileId = Array.from(fileIdToPath.entries()).find(([id, p]) => p === path)?.[0];
            if (fileId === undefined)
                throw new Error(`File ID not found for path: ${path}`);
            results.push(`${fileId}:${str}`);
        });
    } catch (e) {
        console.error(e);
    }
    return results.join('\n');
}

export const grepCodeBaseIdentity: toolIdentity = {
    familly: "navigation",
    name: "grepCodeBase",
    description: `Grep accross the entire codebase. Behaves like VSCode text search, allowing the use of wildcards for including and excluding specific patterns in the search.
        The search is not case sensitive`
}