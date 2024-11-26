import * as vscode from 'vscode';
import * as path from 'path';
import { Worker } from 'worker_threads';
import { ChatWorkerPayload } from '../workers/chat/chat.worker.ts';
import { createUtils } from '../extension.ts';
import { basePayload, inTypeUnion } from '../workers/types.ts';
import { FragolaClient } from '../Fragola/Fragola.ts';
import { END_SENTINEL } from '../workers/types.ts';

export async function handleChatRequest(
    context: vscode.ExtensionContext,
    webview: vscode.Webview,
    payload: ChatWorkerPayload
): Promise<FragolaClient.chunckType> {
    const utils = createUtils(webview, context.extensionUri);
    const workerPath = utils.join('dist', 'workers', 'chat', 'chat.worker.js');

    return new Promise((resolve, reject) => {
        const worker = new Worker(workerPath.fsPath, {
            workerData: { payload }
        });

        worker.on('message', (result: basePayload<"chunck" | typeof END_SENTINEL> & { data: FragolaClient.chunckType }) => {
            console.log("!Parent here ok: ", result);
            if (result.type == END_SENTINEL) {
                webview.postMessage(result);
                worker.terminate();
                resolve(result.data);
                return ;
            } else {
                webview.postMessage(result);
            }
            // if (result.type == "chunck") {
            //     if (result['data'] == END_SENTINEL) {
            //         webview.postMessage(result);
            //         worker.terminate();
            //         resolve(result);
            //         return;
            //     }
            //     webview.postMessage(result);
            // } else if (result.type == "completed") {
            //     return result.data;
            //     console.log("complete", result);
            // }
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

        // const payload: ChatWorkerPayload = {
        //     type: 'chatRequest',
        //     data: { prompt }
        // };

        worker.postMessage(payload);
    });
}