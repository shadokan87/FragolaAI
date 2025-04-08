import * as vscode from 'vscode';
import { FragolaVscode } from './Fragola/vscode/vscode.ts';
import { config } from 'dotenv';
import { _join } from './Fragola/utils.ts';

export async function activate(context: vscode.ExtensionContext) {
    config({ path: _join(context.extensionUri, ".env").fsPath });

    const provider = new FragolaVscode(context);
    const sidebarView = vscode.window.registerWebviewViewProvider(
        'fragola-ai-sidebar',
        provider,
        {
            webviewOptions: { retainContextWhenHidden: true },
        }
    );

    context.subscriptions.push(sidebarView);
}

export function deactivate() { }

function printMessage(message: string) {
    console.log(message);
}
