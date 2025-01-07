import * as vscode from "vscode";
import { createUtils } from "./utils";
import { FragolaClient } from "./Fragola";
import { extensionState, defaultExtensionState, messageType } from "@types";
import { outTypeUnion } from "../workers/types";
import { ChatWorkerPayload } from "../workers/chat/chat.worker";
import { handleChatRequest } from "../handlers/chatRequest";
import { streamChunkToMessage } from "@utils";
import { processJsFiles, createWebviewContent } from "./postSvelteBuild";

export class FragolaVscode implements vscode.WebviewViewProvider {
    private extensionContext: vscode.ExtensionContext;

    constructor(extensionContext: vscode.ExtensionContext) {
        this.extensionContext = extensionContext;
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
                    vscode.Uri.joinPath(extensionUri, "dist", "workers", "webview"), // Add this line
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
        
        function restoreExtensionState(): extensionState {
            return defaultExtensionState;
        }
        
        let extensionState = restoreExtensionState();
        const fragola = new FragolaClient.createInstance(utils, new FragolaClient.Chat({ ...extensionState.chat }));

        // Subscribe to chat state changes
        fragola.chat.state$.subscribe(chatState => {
            const newState = { ...extensionState, chat: chatState };
            extensionState = newState;
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
                case 'webviewReady':
                    sendThemeInfo(currentThemeId);
                    break;
                case 'alert':
                    vscode.window.showInformationMessage(message.text);
                    break;
                case 'chatRequest':
                    console.log("#br1", message.data);
                    const userMessagePayload = message as ChatWorkerPayload;
                    const userMessage: messageType = { role: "user", content: userMessagePayload.data.prompt.text };
                    if (extensionState.chat.isTmp) {
                        await fragola.chat.create([userMessage], "test");
                    }

                    userMessagePayload.id = fragola.chat.getState().id;
                    const assistantStreamResult = await handleChatRequest(this.extensionContext, webviewView.webview, userMessagePayload);
                    let asMessage = streamChunkToMessage(assistantStreamResult);
                    if (!asMessage.content)
                        asMessage.content = "";
                    if (!asMessage.role)
                        asMessage.role = "assistant";
                    await fragola.chat.addMessage(asMessage as messageType);
                    console.log("!msg", assistantStreamResult);
                    break;
                case "online": {
                    postMessage({ type: "stateUpdate", data: extensionState });
                    sendThemeInfo(currentThemeId);
                    return;
                }
            }
        });

        // Listen for theme changes
        vscode.window.onDidChangeActiveColorTheme(e => {
            currentThemeId = vscode.workspace.getConfiguration('workbench').get('colorTheme') as string;
            sendThemeInfo(currentThemeId);
        });
    }
}