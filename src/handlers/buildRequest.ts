import * as vscode from 'vscode';
import { Worker } from 'worker_threads';
import { createUtils } from '../Fragola/utils.ts';
import { ChatWorkerPayload } from '../workers/chat/chat.worker.ts';
import { basePayload } from '../workers/types.ts';
import { END_SENTINEL } from '../workers/types.ts';
import { chunkType } from '@types';
import { FragolaVscode } from '../Fragola/vscode/vscode.ts';
import { BuildWorkerPayload } from '../workers/build/build.worker.ts';
import { grepCodeBaseSchema, grepCodeBaseToolInfo } from '../Fragola/agentic/tools/navigation/grepCodebase.ts';
import zodToJsonSchema from 'zod-to-json-schema';
import { readFileByIdSchema, readFileByIdToolInfo } from '../Fragola/agentic/tools/navigation/readFileById.ts';

export function handleBuildRequest(
    fragola: FragolaVscode,
    webview: vscode.Webview,
    payload: BuildWorkerPayload,
    onSuccess: () => void,
    onChunk: (message: chunkType) => void,
    onError: (error: Error) => void,
): void {
    const utils = createUtils(webview, fragola.extensionContext.extensionUri);
    const chatWorkerPath = utils.join('dist', 'workers', 'build', 'build.worker.js');
    const buildSpecificPayload: BuildWorkerPayload = {
        ...payload,
        data: {
            ...payload.data,
            build: {
                tools: [{
                    type: "function",
                    function: {
                        ...grepCodeBaseToolInfo,
                        parameters: zodToJsonSchema(grepCodeBaseSchema),
                    }
                }, {
                    type: "function",
                    function: {
                        ...readFileByIdToolInfo,
                        parameters: zodToJsonSchema(readFileByIdSchema)
                    }
                }]
            }
        }
    }
    console.log("__BUILD_PAYLOAD__", buildSpecificPayload);
    const worker = new Worker(chatWorkerPath.fsPath);
    worker.postMessage(buildSpecificPayload);

    worker.on('message', (result: basePayload<"chunk" | typeof END_SENTINEL> & { data: chunkType }) => {
        // console.log("___RES", result);
        if (result.type === END_SENTINEL) {
            console.log("__END_SENTINEL_HERE__");
            onSuccess();
            worker.terminate();
        } else
            onChunk(result.data)
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
}