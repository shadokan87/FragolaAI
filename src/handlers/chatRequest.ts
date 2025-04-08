import * as vscode from 'vscode';
import { Worker } from 'worker_threads';
import { createUtils } from '../Fragola/utils.ts';
import { ChatWorkerPayload } from '../workers/chat/chat.worker.ts';
import { basePayload } from '../workers/types.ts';
import { END_SENTINEL } from '../workers/types.ts';
import { chunkType, MessageType } from '@types';
import { FragolaVscode } from '../Fragola/vscode/vscode.ts';

export function handleChatRequest(
    fragola: FragolaVscode,
    webview: vscode.Webview,
    payload: ChatWorkerPayload,
    onSuccess: () => void,
    onChunk: (newMessages: MessageType[]) => void,
    onError: (error: Error) => void
): void {
    // const utils = createUtils(webview, fragola.extensionContext.extensionUri);
    // const chatWorkerPath = utils.join('dist', 'workers', 'chat', 'chat.worker.js');

    // const worker = new Worker(chatWorkerPath.fsPath, {
    //     workerData: { payload }
    // });

    // worker.on('message', (result: basePayload<"chunk" | typeof END_SENTINEL> & { data: chunkType }) => {
    //     // console.log("___RES", result);
    //     if (result.type === END_SENTINEL) {
    //         console.log("__END_SENTINEL_HERE__");
    //         onSuccess();
    //         worker.terminate();
    //     } else
    //         onChunk(result.data)
    // });

    // worker.on('error', (error) => {
    //     webview.postMessage({ type: 'error', error: error.message });
    //     worker.terminate();
    //     onError(error);
    // });

    // worker.on('exit', (code) => {
    //     if (code !== 0) {
    //         onError(new Error(`Chat worker stopped with exit code ${code}`));
    //     }
    // });

    // worker.postMessage(payload);
}