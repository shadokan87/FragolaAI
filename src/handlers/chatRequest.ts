import * as vscode from 'vscode';
import { Worker } from 'worker_threads';
import { createUtils } from '../Fragola/utils.ts';
import { ChatWorkerPayload } from '../workers/chat/chat.worker.ts';
import { basePayload } from '../workers/types.ts';
import { END_SENTINEL } from '../workers/types.ts';
import { chunkType } from '@types';

export function handleChatRequest(
    context: vscode.ExtensionContext,
    webview: vscode.Webview,
    payload: ChatWorkerPayload,
    onSuccess: () => void,
    onChunk: (message: chunkType) => void,
    onError: (error: Error) => void
): void {
    const utils = createUtils(webview, context.extensionUri);
    const chatWorkerPath = utils.join('dist', 'workers', 'chat', 'chat.worker.js');

    const worker = new Worker(chatWorkerPath.fsPath, {
        workerData: { payload }
    });

    worker.on('message', (result: basePayload<"chunk" | typeof END_SENTINEL> & { data: chunkType }) => {
        onChunk(result.data)
        if (result.type === END_SENTINEL) {
            onSuccess();
            worker.terminate();
        }
    });

    worker.on('error', (error) => {
        webview.postMessage({ type: 'error', error: error.message });
        worker.terminate();
        onError(error);
    });

    worker.on('exit', (code) => {
        if (code !== 0) {
            onError(new Error(`Chat worker stopped with exit code ${code}`));
        }
    });

    worker.postMessage(payload);
}