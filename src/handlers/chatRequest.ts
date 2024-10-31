import * as vscode from 'vscode';
import * as path from 'path';
import { ChatWorkerPayload } from '../workers/chat/chat.worker';
import axios from 'axios';
import { readFileSync } from 'fs';
// import { Worker } from 'worker_threads';


export async function handleChatRequest(
    context: vscode.ExtensionContext,
    webview: vscode.Webview,
    prompt: string
) {
    const workerPath = path.join(context.extensionPath, 'dist', 'workers', 'chat', 'chat.worker.js');

    // Read the worker file content
    const workerContent = readFileSync(workerPath, 'utf-8');

    // Create a blob URL
    const blob = new Blob([workerContent], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);
    const worker = new Worker(blobUrl);
    // Create the worker using worker_threads
    if (worker) {
        const payload: ChatWorkerPayload = {
            type: "chatRequest",
            data: {
                prompt
            }
        };
        console.log("#br2");
        worker.postMessage(payload);
        // worker.onmessage(event => {
        //     vscode.window.showInformationMessage(`received ${JSON.stringify(event)}`);
        //     // webview.postMessage(payload);
        // });
    }
    else
        console.error("Worker undefined");
}