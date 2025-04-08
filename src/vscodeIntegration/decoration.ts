import * as vscode from "vscode";

export function createDecoration(textEditor: vscode.TextEditor, decoration: vscode.TextEditorDecorationType) {
    function decorateRange(range: vscode.Range[]) {
        textEditor.setDecorations(decoration, range);
    }

    function clear(range?: vscode.Range[]) {
        textEditor.setDecorations(decoration, range || []);
    }

    return {
        decorateRange,
        clear
    }
}