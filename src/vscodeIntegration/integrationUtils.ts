import * as vscode from "vscode";

export async function getEditorForFile(filePath: string): Promise<vscode.TextEditor> {
    const document = await vscode.workspace.openTextDocument(filePath);
    const editor = await vscode.window.showTextDocument(document);
    return editor;
}