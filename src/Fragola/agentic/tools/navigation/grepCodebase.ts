import { z } from "zod";
import { glob } from "glob";
import { readFileSync } from "fs";
import { join } from "path";
import { exec, ExecException, execSync } from "child_process";
import { stdin, stdout } from "process";
import { ToolUnexpectedError } from "../../../exceptions/ToolUnexpectedError";
import { ToolInfo, ToolType } from "@types";

export const grepCodeBaseToolInfo: ToolInfo = {
    name: "grepCodeBase",
    description: 'A tool for searching the entire codebase for specific content. Use this when you need to find occurrences of a particular string, function name, or pattern across multiple files. It returns an array of items formatted as "<file_id>:<match_count>", allowing you to locate and quantify matches throughout the project.'
}

export const grepCodeBaseSchema = z.object({
    content: z.string().describe("The text or pattern to search for in the codebase"),
    includeFile: z.string().describe("Optional glob pattern to include specific file types in the search").optional(),
    excludeFile: z.string().describe("Optional glob pattern to exclude specific file types from the search").optional()
});

export function grepCodebaseInternal(projectRoot: string, params: z.infer<typeof grepCodeBaseSchema>): string | ExecException {
    // const { rgPath } = require("@vscode/ripgrep");
    const rgPath = "/usr/bin/rg";
    const { includeFile, excludeFile, content } = params;
    let stdout: string = "";

    let command = [`${rgPath}`, '--json', '--no-line-number', '--count', '--ignore-case'];

    if (includeFile) {
        command.push('--glob', includeFile);
    }

    if (excludeFile) {
        command.push('--glob', `!${excludeFile}`);
    }

    command.push(content, projectRoot);

    try {
        stdout = execSync(command.join(' '), { encoding: 'utf-8' });
        console.log("Stdout: ", stdout);
    } catch (e) {
        return e as ExecException;
    }
    return stdout;
}

export function grepCodebase(projectRoot: string, params: z.infer<typeof grepCodeBaseSchema>, postResult?: (result: string) => string): string {
    const result = (() => {
        const _result = grepCodebaseInternal(projectRoot, params);
        if (typeof _result != "string") {
            return "The search ran succesfully but resulted in 0 match";
            // if (_result.code == 1)
            //     return "";
            // throw new ToolUnexpectedError(_result.message, "grepCodeBase", _result);
        }
        return _result;
    })();
    const message = (_result: string) => {
        if (!_result.trim().length)
            return "The search ran succesfully but resulted in 0 match";
        return _result;
    }
    return postResult ? message(postResult(result)) : message(result);
}