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
import { shellSchema, shellToolInfo } from '../Fragola/agentic/tools/exec/shell.ts';
import { codeGenSchema, codeGenToolInfo } from '../Fragola/agentic/tools/code/codeSnippet.ts';
import { join } from 'path';

export function handleBuildRequest(
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
                },
                {
                    type: "function",
                    function: {
                        ...codeGenToolInfo,
                        parameters: zodToJsonSchema(codeGenSchema)
                    }
                }
                ]
            }
        }
    };

    console.log("__BUILD_PAYLOAD__", buildSpecificPayload);
    const worker = new Worker(chatWorkerPath.fsPath);
    worker.postMessage(buildSpecificPayload);

    worker.on('message', async (result: basePayload<"chunk" | typeof END_SENTINEL | "shell" | "workspace-edit"> & { data: MessageType[] | Record<string, any> }) => {
        if (result.type === END_SENTINEL) {
            console.log("__END_SENTINEL_HERE__");
            onSuccess();
            worker.terminate();
        }
        else if (result.type == "shell") {
            console.log("Workspace edit", result);
            const parameters = result.data as z.infer<typeof codeGenSchema>;
            const command = parameters.sourceCode;
            const terminal = vscode.window.createTerminal('Build Command');
            terminal.sendText(command, false);
            terminal.show();
        } else if (result.type == "workspace-edit") {
            // Already safe parsed in recursiveAgent, so we can use JSON.parse
            const parameters = result.data as z.infer<typeof codeGenSchema>;

            const workspaceEdit = new vscode.WorkspaceEdit();
            if (["CREATE", "UPDATE"].includes(parameters.actionType) && parameters.sourceCode) {
                if (!parameters.path) {
                    console.error("parameters.path undefined");
                    return;
                }
                let path: string | undefined = parameters.path;
                let fsPath = ((): string => {
                    if (parameters.actionType == "CREATE") {
                        return join(fragola.tree.getCwd()!, path)
                    }
                    if (path.includes("/")) {
                        return join(fragola.tree.getCwd()!, path)
                    } else {
                        const fsPath = fragola.tree.idToPath.get(path);
                        if (!fsPath) {
                            //TODO: handle error
                            throw new Error("fsPath undefined");
                        }
                        return fsPath;
                    }
                })();
                let fileUri = vscode.Uri.file(fsPath);
                console.log("__URI", fileUri);
                console.log("__FS_PATH", fsPath);
                const fileExists = await vscode.workspace.fs.stat(fileUri).then(() => true, () => false);
                if (parameters.actionType == "CREATE" && !fileExists) {
                    workspaceEdit.createFile(fileUri, { overwrite: true, contents: new TextEncoder().encode(parameters.sourceCode) });
                } else {
                    workspaceEdit.replace(fileUri, new vscode.Range(0, 0, Number.MAX_VALUE, Number.MAX_VALUE), parameters.sourceCode);
                }
                await vscode.workspace.applyEdit(workspaceEdit);
            }
        }
        else if (result.type == "chunk") {
            onChunk(result.data as MessageType[])
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
}