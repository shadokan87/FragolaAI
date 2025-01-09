import * as vscode from "vscode";
import { createUtils } from "./utils";
import { FragolaClient } from "./Fragola";
import { chunkType, extensionState, GlobalKeys, HistoryIndex, InteractionMode, MessageExtendedType, MessageType, NONE_SENTINEL } from "@types";
import { outTypeUnion } from "../workers/types";
import { ChatWorkerPayload } from "../workers/chat/chat.worker";
import { handleChatRequest } from "../handlers/chatRequest";
import { streamChunkToMessage, defaultExtensionState, updateExtensionState as _updateExtensionState } from "@utils";
import { processJsFiles, createWebviewContent } from "./postSvelteBuild";
import { BehaviorSubject } from 'rxjs';
import moment from "moment";
import { ChatCompletionMessageParam } from "@shadokan87/token.js";

type StateScope = "global" | "workspace";

export class FragolaVscode implements vscode.WebviewViewProvider {
    private extensionContext: vscode.ExtensionContext;
    private state$ = new BehaviorSubject<extensionState>(defaultExtensionState);

    constructor(extensionContext: vscode.ExtensionContext) {
        this.extensionContext = extensionContext;
    }

    async updateState<T extends string>(key: T, value: any, scope: StateScope = "workspace") {
        await this.extensionContext[`${scope}State`].update(key, value);
        // const currentState = this.state$.getValue();
        // this.state$.next({
        //     ...currentState,
        //     [scope]: {
        //         ...currentState[scope],
        //         [key]: value
        //     }
        // });
    }

    async getState<T extends string>(key: T, scope: StateScope = "workspace") {
        await this.extensionContext[`${scope}State`].get(key);
    }

    updateExtensionState(callback: Parameters<typeof _updateExtensionState>[1]) {
        _updateExtensionState(this.state$, callback);
    }

    async resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        token: vscode.CancellationToken
    ): Promise<void> {
        const utils = createUtils(webviewView.webview, this.extensionContext.extensionUri);
        const { extensionUri } = this.extensionContext;

        if (!webviewView.webview.html) {
            webviewView.webview.options = {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, "svelte", "dist", "assets"),
                    vscode.Uri.joinPath(extensionUri, "dist", "workers", "webview"),
                    vscode.Uri.joinPath(extensionUri, "src", "data")
                ]
            };

            const utils = createUtils(webviewView.webview, extensionUri);
            const worker_path = utils.joinAsWebViewUri("svelte", "dist", "assets", "syntaxHighlight.worker.js");
            processJsFiles(extensionUri, utils, [(jsFile) => jsFile.replace(/__VSCODE_WORKER_PATH__/g, worker_path.toString())]);
            webviewView.webview.html = createWebviewContent(extensionUri, utils)
                .replace(/__VSCODE_CSP_SOURCE__/g, webviewView.webview.cspSource)
                ;
        }

        // function restoreExtensionState(): extensionState {
        //     return defaultExtensionState;
        // }

        const fragola = FragolaClient.createInstance(utils, new FragolaClient.Chat(this.state$, utils));

        // Subscribe to state changes and notify webview
        this.state$.subscribe(newState => {
            webviewView.webview.postMessage({
                type: "stateUpdate",
                data: newState
            });
        });

        // Color theme sync
        let currentThemeId = vscode.workspace.getConfiguration('workbench').get('colorTheme') as string;
        const { postMessage } = utils;
        const sendThemeInfo = (data: string) => {
            postMessage({
                type: "colorTheme",
                data
            });
        };

        webviewView.webview.onDidReceiveMessage(async message => {
            switch (message.type as outTypeUnion) {
                case "history": {
                    break;
                }
                case 'alert':
                    vscode.window.showInformationMessage(message.text);
                    break;
                case 'chatRequest':
                    const userMessagePayload = message as ChatWorkerPayload;
                    const userMessage: MessageType = { role: "user", content: JSON.stringify(userMessagePayload.data.prompt) };
                    const extendedMessage: MessageExtendedType = {
                        ...userMessage,
                        meta: {
                            prompt: userMessagePayload.data.prompt,
                            interactionMode: this.state$.getValue().workspace.ui.interactionMode,
                        }
                    }
                    if (this.state$.getValue().workspace.ui.conversationId == NONE_SENTINEL) {
                        try {
                            const id = await fragola.chat.create([extendedMessage]);
                            this.updateExtensionState((prev) => {
                                const historyIndex: HistoryIndex[] = [...prev.workspace.historyIndex, {
                                    id, meta: {
                                        label: undefined, createdAt: moment().format('YYYY-MM-DD')
                                    }
                                }];
                                return {
                                    ...prev,
                                    workspace: {
                                        ...prev.workspace,
                                        ui: {
                                            ...prev.workspace.ui,
                                            conversationId: id
                                        },
                                        historyIndex,
                                        messages: [extendedMessage]
                                    }
                                }
                            })
                        } catch (e) {
                            console.error("__ERR__", e);
                        }
                    } else {
                        await fragola.chat.addMessages(this.state$.getValue().workspace.ui.conversationId, [extendedMessage]);
                    }
                    const assistantStreamResult = await handleChatRequest(this.extensionContext, webviewView.webview, userMessagePayload);
                    let asMessage = streamChunkToMessage(assistantStreamResult);
                    if (!asMessage.content)
                        asMessage.content = "";
                    if (!asMessage.role)
                        asMessage.role = "assistant"
                    try {
                        await fragola.chat.addMessages(
                            this.state$.getValue().workspace.ui.conversationId

                            , [asMessage as MessageType])
                    } catch (e) {
                        console.error("__ERR__", e);
                    }
                    break;
                case "online": {
                    postMessage({ type: "stateUpdate", data: this.state$.getValue() });
                    sendThemeInfo(currentThemeId);
                    break;
                }
            }
        })

        // Listen for theme changes
        vscode.window.onDidChangeActiveColorTheme(e => {
            currentThemeId = vscode.workspace.getConfiguration('workbench').get('colorTheme') as string;
            sendThemeInfo(currentThemeId);
        });
    }
}