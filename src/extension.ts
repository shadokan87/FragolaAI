import * as vscode from 'vscode';
import { join } from "path";
import { readFileSync, writeFile } from 'fs';
import { readdir } from 'fs/promises';
import { handleChatRequest } from './handlers/chatRequest.ts';
import { ChatWorkerPayload } from './workers/chat/chat.worker.ts';
import { FragolaClient } from './Fragola/Fragola.ts';
import markdown_code_snippet from "./test/streamMocks/markdown_code_snippet.json";
import { knex as Knex } from 'knex';
import { config } from 'dotenv';
import { chunkType, defaultExtensionState, extensionState, messageType, payloadTypes } from '@types';
import { inTypeUnion, outTypeUnion } from './workers/types.ts';
import OpenAI from 'openai';
import { streamChunkToMessage } from '@utils';
import { FragolaVscode } from './Fragola/vscode.ts';

// Track the visibility state of the chat view
let isChatViewVisible = false;

const toggleChatView = async () => {
    if (isChatViewVisible) {
        // Hide the view
        await vscode.commands.executeCommand('workbench.action.closeSidebar');
        isChatViewVisible = false;
    } else {
        // Show the view
        await vscode.commands.executeCommand('workbench.view.extension.fragola-ai-view');
        isChatViewVisible = true;
    }
};

export async function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "fragola-ai" is now active!');

    const provider = new FragolaVscode(context)
    const sidebarView = vscode.window.registerWebviewViewProvider(
        'fragola-ai-sidebar',
        provider
    );

    context.subscriptions.push(sidebarView);

    // Register command for keyboard shortcut with toggle functionality
    const openChatCommand = vscode.commands.registerCommand('fragola-ai.openChat', toggleChatView);
    context.subscriptions.push(openChatCommand);
}

export function deactivate() { }
