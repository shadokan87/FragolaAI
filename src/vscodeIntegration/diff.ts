import { existsSync } from "fs";
import { join, basename } from "path";
import * as vscode from "vscode";
import { DIFF_VIEW_URI_SCHEME } from "./common";

export function createDiffForFile(projectRoot: string, relativePath: string, newContent: string = "") {
    const fullPath = join(projectRoot, relativePath);
    const fileName = basename(fullPath);
    const fileExist = existsSync(fullPath);
    const uri = vscode.Uri.file(fullPath);

    const rightUri = vscode.Uri.parse(`${DIFF_VIEW_URI_SCHEME}:${fileName}`).with({
        query: Buffer.from(newContent).toString("base64")
    });

    const leftUri = uri;

    const title = fileExist ? `${fileName}: Original (read only) ↔ Bootscreen's Changes (editable)` : `${fileName}: New File`;

    vscode.commands.executeCommand("vscode.diff", leftUri, rightUri, title);
}