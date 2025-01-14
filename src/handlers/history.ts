import * as vscode from 'vscode';
import { Worker } from 'worker_threads';
import { createUtils } from '../Fragola/utils.ts';
import { HistoryWorkerPayload } from '../workers/history/history.worker.mts';

export function historyHandler(
    context: vscode.ExtensionContext,
    webview: vscode.Webview,
    payload: HistoryWorkerPayload,
    onSuccess: () => void,
    onError: (error: Error) => void
): void {
    const utils = createUtils(webview, context.extensionUri);
    const historyWorkerPath = utils.join('dist', 'workers', 'history', 'history.worker.js');

    const worker = new Worker(historyWorkerPath.fsPath, {
        workerData: { payload }
    });

    worker.on('message', (result: { type: "SUCCESS" | "ERROR" }) => {
        // webview.postMessage(result);
        if (result.type == "SUCCESS") {
            worker.terminate();
            onSuccess();
        }
    });

    worker.on('error', (error) => {
        webview.postMessage({ type: 'error', error: error.message });
        worker.terminate();
        onError(error);
    });

    worker.on('exit', (code) => {
        if (code !== 0) {
            onError(new Error(`History worker stopped with exit code ${code}`));
        }
    });

    worker.postMessage(payload);
}