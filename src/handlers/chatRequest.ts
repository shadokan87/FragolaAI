import * as vscode from 'vscode';
import * as path from 'path';
import { Worker } from 'worker_threads';
import { ChatWorkerPayload } from '../workers/chat/chat.worker';
import { createUtils } from '../extension';

export async function handleChatRequest(
    context: vscode.ExtensionContext,
    webview: vscode.Webview,
    prompt: string
) {
    const utils = createUtils(webview, context.extensionUri);
    const workerPath = utils.join('dist', 'workers', 'chat', 'chat.worker.js');

    return new Promise((resolve, reject) => {
        const worker = new Worker(workerPath.fsPath, {
            workerData: { prompt }
        });

        worker.on('message', (result) => {
            console.log("!Parent here ok: ", result);
            if (result['data'] == '__END__') {
                worker.terminate();
                resolve(result);
                return ;
            }
            webview.postMessage(result);
        });

        worker.on('error', (error) => {
            webview.postMessage({ type: 'error', error: error.message });
            worker.terminate();
            reject(error);
        });

        worker.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Worker stopped with exit code ${code}`));
            }
        });

        const payload: ChatWorkerPayload = {
            type: 'chatRequest',
            data: { prompt }
        };

        worker.postMessage(payload);
    });
}