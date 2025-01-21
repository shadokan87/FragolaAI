import * as vscode from 'vscode';
import { FragolaVscode } from './Fragola/vscode.ts';
import { config } from 'dotenv';
import { _join } from './Fragola/utils.ts';

export async function activate(context: vscode.ExtensionContext) {
    config({ path: _join(context.extensionUri, ".env").fsPath});

    const provider = new FragolaVscode(context);
    const sidebarView = vscode.window.registerWebviewViewProvider(
        'fragola-ai-sidebar',
        provider
    );

    context.subscriptions.push(sidebarView);
}

export function deactivate() { }