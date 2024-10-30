import * as vscode from 'vscode';

export async function handleChatRequest(webview: vscode.Webview, prompt: string) {
 const worker = new Worker('./chatbot.worker.js', { type: 'module' });
    worker.onmessage = (event) => {
        // Handle messages from the worker
        webview.postMessage({type: "chatRequest", prompt})
    };
}