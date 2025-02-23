import * as vscode from 'vscode';
import { Worker } from 'worker_threads';
import { createUtils } from '../Fragola/utils.ts';
import { ChatWorkerPayload } from '../workers/chat/chat.worker.ts';
import { basePayload } from '../workers/types.ts';
import { END_SENTINEL } from '../workers/types.ts';
import { chunkType, MessageType } from '@types';
import { FragolaVscode } from '../Fragola/vscode/vscode.ts';
import { BuildWorkerPayload } from '../workers/build/build.worker.ts';
import { grepCodeBaseSchema, grepCodeBaseToolInfo, grepCodebase } from '../Fragola/agentic/tools/navigation/grepCodebase.ts';
import zodToJsonSchema from 'zod-to-json-schema';
import { readFileById, readFileByIdSchema, readFileByIdToolInfo } from '../Fragola/agentic/tools/navigation/readFileById.ts';
import { z } from 'zod';
import { ToolMap } from '../Fragola/agentic/recursiveAgent.ts';
import { createSubTaskInfo, createSubTaskSchema } from '../Fragola/agentic/tools/plan/createTask.ts';

export function handlePlanRequest(
    fragola: FragolaVscode,
    webview: vscode.Webview,
    payload: BuildWorkerPayload,
    onSuccess: () => void,
    onChunk: (newMessages: MessageType[]) => void,
    onError: (error: Error) => void,
): void {
    if (!fragola.tree.getCwd()) {
        //TODO: handle error
        return;
    }
    const utils = createUtils(webview, fragola.extensionContext.extensionUri);
    const chatWorkerPath = utils.join('dist', 'workers', 'plan', 'plan.worker.js');
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
                },
                {
                    type: "function",
                    function: {
                        ...createSubTaskInfo,
                        parameters: zodToJsonSchema(createSubTaskSchema)
                    }
                }
                ]
            }
        }
    };

    console.log("__BUILD_PAYLOAD__", buildSpecificPayload);
    const worker = new Worker(chatWorkerPath.fsPath);
    worker.postMessage(buildSpecificPayload);

    worker.on('message', (result: basePayload<"chunk" | typeof END_SENTINEL> & { data: MessageType[] }) => {
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