import * as vscode from "vscode";
import { createUtils } from "./utils";
import { FragolaClient } from "./Fragola";
import { chunkType, extensionState, GlobalKeys, HistoryIndex, InteractionMode, MessageExtendedType, MessageType, NONE_SENTINEL } from "@types";
import { outTypeUnion } from "../workers/types";
import { ChatWorkerPayload } from "../workers/chat/chat.worker";
import { handleChatRequest } from "../handlers/chatRequest";
import { streamChunkToMessage, defaultExtensionState } from "@utils";
import { processJsFiles, createWebviewContent } from "./postSvelteBuild";
import { BehaviorSubject, pairwise, map, distinctUntilChanged } from 'rxjs';
import moment from "moment";
import { ChatCompletionMessageParam } from "@shadokan87/token.js";
import { stateChangeMiddleware } from "./middleware";
import { historyHandler } from "../handlers/history";
import { HistoryWorkerPayload } from "../workers/history/history.worker.mts";

type StateScope = "global" | "workspace";

export class FragolaVscode implements vscode.WebviewViewProvider {
    private extensionContext: vscode.ExtensionContext;

    constructor(extensionContext: vscode.ExtensionContext, private state$ = new BehaviorSubject<extensionState>(defaultExtensionState)) {
        this.extensionContext = extensionContext;
    }

    async updateState<T extends string>(key: T, value: any, scope: StateScope = "workspace") {
        await this.extensionContext[`${scope}State`].update(key, value);
    }

    async getState<T extends string>(key: T, scope: StateScope = "workspace") {
        await this.extensionContext[`${scope}State`].get(key);
    }

    updateExtensionState(callback: (prev: extensionState) => extensionState) {
        this.state$.next(callback(this.state$.getValue()));
    }

    handleHistoryError(payload: HistoryWorkerPayload, error: Error) {
        // TODO: error handling
        console.error(`Failed to ${payload.kind.toLowerCase()} messages, error: ${error.message}`);
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
                    let conversationId = userMessagePayload.id;
                    if (conversationId == NONE_SENTINEL || !conversationId) {
                        try {
                            conversationId = fragola.chat.create([extendedMessage]);
                            const historyPayload: HistoryWorkerPayload = {
                                kind: "CREATE",
                                initialMessages: [extendedMessage],
                                id: conversationId,
                                extensionFsPath: this.extensionContext.extensionUri.fsPath
                            }
                            historyHandler(this.extensionContext, webviewView.webview, historyPayload, () => { }, (error) => this.handleHistoryError(historyPayload, error));
                        } catch (e) {
                            console.error("__ERR__", e);
                        }
                    } else {
                        fragola.chat.addMessages(conversationId, [extendedMessage]);
                    }
                    const assistantStreamResult = await handleChatRequest(this.extensionContext, webviewView.webview, {...userMessagePayload, id: conversationId});
                    let asMessage = streamChunkToMessage(assistantStreamResult);
                    if (!asMessage.content)
                        asMessage.content = "";
                    if (!asMessage.role)
                        asMessage.role = "assistant"
                    try {
                        if (!conversationId)
                            throw new Error("conversationId undefined");
                        fragola.chat.addMessages(
                            conversationId, [asMessage as MessageType]);
                        const historyPayload: HistoryWorkerPayload = {
                            kind: "UPDATE",
                            newMessages: [asMessage as MessageType],
                            id: conversationId,
                            extensionFsPath: this.extensionContext.extensionUri.fsPath
                        };
                        historyHandler(this.extensionContext, webviewView.webview, historyPayload, () => { }, (error) => this.handleHistoryError(historyPayload, error));
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