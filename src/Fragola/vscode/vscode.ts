import * as vscode from "vscode";
import { createUtils, copyStateWithoutRuntimeVariables } from "../utils";
import { FragolaClient } from "../Fragola";
import { ExtensionState, MessageExtendedType, MessageType, NONE_SENTINEL, payloadTypes } from "@types";
import { outTypeUnion } from "../../workers/types";
import { ChatWorkerPayload } from "../../workers/chat/chat.worker";
import { handleChatRequest } from "../../handlers/chatRequest";
import { streamChunkToMessage, defaultExtensionState, receiveStreamChunk, Mutex } from "@utils";
import { processJsFiles, createWebviewContent } from "../postSvelteBuild";
import { BehaviorSubject, pairwise } from 'rxjs';
import { historyHandler } from "../../handlers/history";
import { DbType, HistoryWorkerPayload } from "../../workers/history/history.worker.mts";
import { isEqual } from 'lodash';
import { join } from "path";
import { TextFileSync } from "lowdb/node";
import { glob } from "glob";
import { FragolaVscodeBase } from "./types";
import { Tree } from "./tree";

type StateScope = "global" | "workspace";

export class FragolaVscode extends FragolaVscodeBase implements vscode.WebviewViewProvider {
    private extensionContext: vscode.ExtensionContext;
    private isChatViewVisible = false;
    private state$: BehaviorSubject<ExtensionState>;
    private tree: Tree;
    // private treeService: TreeService;
    constructor(extensionContext: vscode.ExtensionContext) {
        super();
        this.extensionContext = extensionContext;
        this.registerCommands();
        this.state$ = new BehaviorSubject({ ...defaultExtensionState });
        this.tree = new Tree(vscode.workspace.workspaceFolders?.map((folder) => folder.uri.fsPath).at(0));
        this.initializeState();
        // this.treeService = new TreeService(extensionContext.)
    }

    private async initializeState() {
        const restoredState = await this.restoreExtensionState();
        this.state$.next(restoredState);
    }

    async updateState<T extends string>(key: T, value: any, scope: StateScope = "workspace") {
        await this.extensionContext[`${scope}State`].update(key, value);
    }

    getState<T extends string>(key: T, scope: StateScope = "workspace") {
        return this.extensionContext[`${scope}State`].get(key);
    }

    async restoreExtensionState() {
        const workspaceStateRaw = this.getState("workspace");
        const globalStateRaw = this.getState("global");
        let extensionState: ExtensionState = { ...defaultExtensionState };
        let saveWorkspaceState = false;
        let fsConversationIds: string[] = [];

        try {
            const files = await glob(join(this.extensionContext.extensionUri.fsPath, "src", "data", "chat", "*.json"), {});
            fsConversationIds = files.map(file => file.split("/").at(-1)?.split(".").at(0)).filter((name): name is string => name != undefined);
        } catch (e) {
            //TODO: handle error
            fsConversationIds = [];
        }
        // Retrieving existing chat conversation Ids from fs, 
        if (typeof workspaceStateRaw == "object") {
            const workspaceState = workspaceStateRaw as ExtensionState["workspace"];
            if (Object.keys(workspaceState).length == 0)
                return extensionState;
            extensionState.workspace = workspaceState;
            extensionState.workspace.tree = this.tree.getResult();
            // Making sure extensionState historyIndex is in sync with actual files by removing indexes without an acutal fs file            
            {
                const staleConversationIds: string[] = extensionState.workspace.historyIndex.map(index => {
                    if (!fsConversationIds.includes(index.id))
                        return index.id;
                }).filter(value => value != undefined);

                if (staleConversationIds.length) {
                    extensionState.workspace.historyIndex = extensionState.workspace.historyIndex.filter(index => !staleConversationIds.includes(index.id));
                    if (staleConversationIds.includes(extensionState.workspace.ui.conversationId))
                        extensionState.workspace.ui.conversationId = NONE_SENTINEL;
                }
            }

            if (extensionState.workspace.ui.conversationId != NONE_SENTINEL) {
                const filePath = join(this.extensionContext.extensionUri.fsPath, "src", "data", "chat", extensionState.workspace.ui.conversationId) + ".json";
                const textFile = new TextFileSync(filePath);
                const content = textFile.read();
                if (!content) {
                    extensionState.workspace.ui.conversationId = NONE_SENTINEL;
                    saveWorkspaceState = true;
                } else {
                    const contentCasted: DbType = JSON.parse(content);
                    extensionState.workspace.messages = contentCasted;
                }
            }
        }
        if (saveWorkspaceState)
            this.updateState("workspace", extensionState.workspace);
        return extensionState;
    }

    updateExtensionState(callback: (prev: ExtensionState) => ExtensionState) {
        this.state$.next(callback(this.state$.getValue()));
    }

    handleHistoryError(payload: HistoryWorkerPayload, error: Error) {
        // TODO: error handling
        console.error(`Failed to ${payload.kind.toLowerCase()} messages, error: ${error.message}`);
    }

    private async commandToggleChatView() {
        if (this.isChatViewVisible) {
            await vscode.commands.executeCommand('workbench.action.closeSidebar');
            this.isChatViewVisible = false;
        } else {
            await vscode.commands.executeCommand('workbench.view.extension.fragola-ai-view');
            this.isChatViewVisible = true;
        }
    }

    private commandNewConversation() {
        console.log("state____", this.state$);
        if (this.state$.getValue().workspace.ui.conversationId == NONE_SENTINEL)
            return;
        this.updateExtensionState((prev) => {
            return {
                ...prev,
                workspace: {
                    ...prev.workspace,
                    ui: {
                        ...prev.workspace.ui,
                        conversationId: NONE_SENTINEL
                    }
                }
            }
        })
    }

    private commandShowHistory() {
        this.updateExtensionState((prev) => {
            return {
                ...prev,
                workspace: {
                    ...prev.workspace,
                    ui: {
                        ...prev.workspace.ui,
                        showHistory: !prev.workspace.ui.showHistory
                    }
                }
            }
        })
    }

    private registerCommands() {
        // Register command for keyboard shortcut with toggle functionality
        this.extensionContext.subscriptions.push(
            vscode.commands.registerCommand('fragola-ai.openChat', () => this.commandToggleChatView())
        );

        // Register newConversation command
        this.extensionContext.subscriptions.push(
            vscode.commands.registerCommand('fragola-ai.newConversation', () => this.commandNewConversation())
        );

        // Register showHistory command
        this.extensionContext.subscriptions.push(
            vscode.commands.registerCommand('fragola-ai.showHistory', () => this.commandShowHistory())
        );
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

        const fragola = FragolaClient.createInstance(utils, new FragolaClient.Chat(this.state$, utils));

        // Subscribe to state changes and notify webview
        this.state$.pipe(
            pairwise(),
        ).subscribe(([prev, newState]) => {
            console.log("_STATE_", newState);
            if (newState.workspace.streamState != "STREAMING") {
                const [prevCopy, newCopy] = [copyStateWithoutRuntimeVariables(prev), copyStateWithoutRuntimeVariables(newState)];
                if (!isEqual(prevCopy.global, newCopy.global)) {
                    this.updateState("global", newCopy.global);
                    console.log("__SAVED_STATE__", this.extensionContext.workspaceState.get("global"));
                }

                if (!isEqual(prevCopy.workspace, newCopy.workspace)) {
                    this.updateState("workspace", newCopy.workspace, "workspace");
                    console.log("__SAVED_STATE__", this.extensionContext.workspaceState.get("workspace"));
                }
            }
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
                case "deleteConversation": {
                    const payload = message as payloadTypes.action.deleteConversation;
                    await fragola.chat.deleteConversation(payload.parameters);
                    break ;
                }
                case "actionConversationClick": {
                    const payload = message as payloadTypes.action.conversationClick;
                    if (!this.state$.getValue().workspace.historyIndex.some(history => history.id == payload.parameters.conversationId)) {
                        // TODO: handle error
                        console.error(`Conversation with id ${payload.parameters.conversationId} does not exist`);
                        return;
                    }
                    const filePath = join(this.extensionContext.extensionUri.fsPath, "src", "data", "chat", payload.parameters.conversationId) + ".json";
                    const textFile = new TextFileSync(filePath);
                    const content = textFile.read();
                    if (!content) {
                        //TODO: handle error
                        console.error(`Content empty for conversation ${payload.parameters.conversationId}`);
                        return;
                    }
                    const contentCasted: DbType = JSON.parse(content);
                    this.updateExtensionState(prev => {
                        return {
                            ...prev,
                            workspace: {
                                ...prev.workspace,
                                ui: {
                                    ...prev.workspace.ui,
                                    conversationId: payload.parameters.conversationId,
                                    showHistory: false
                                },
                                messages: contentCasted
                            }
                        }
                    })
                    break;
                }
                case 'alert':
                    vscode.window.showInformationMessage(message.text);
                    break;
                case 'chatRequest':
                    this.updateExtensionState((prev) => {
                        return {
                            ...prev, workspace: {
                                ...prev.workspace,
                                streamState: "AWAITING"
                            }
                        }
                    });

                    const userMessagePayload = message as ChatWorkerPayload;
                    const userMessage: MessageType = { role: "user", content: JSON.stringify(userMessagePayload.data.prompt) };
                    const extendedMessage: MessageExtendedType = {
                        ...userMessage,
                        meta: {
                            prompt: userMessagePayload.data.prompt,
                            interactionMode: this.state$.getValue().workspace.ui.interactionMode,
                        }
                    }
                    let { conversationId } = userMessagePayload.data;
                    if (conversationId == NONE_SENTINEL || !conversationId) {
                        try {
                            conversationId = await fragola.chat.create([extendedMessage]);
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
                        try {
                            const historyPayload: HistoryWorkerPayload = {
                                kind: "UPDATE",
                                newMessages: [extendedMessage],
                                id: conversationId,
                                extensionFsPath: this.extensionContext.extensionUri.fsPath
                            }
                            historyHandler(this.extensionContext, webviewView.webview, historyPayload, () => { }, (error) => this.handleHistoryError(historyPayload, error));
                            fragola.chat.addMessages([extendedMessage]);
                        } catch (e) {

                        }
                    }
                    let fullMessage: Partial<MessageType> = {};
                    let streamStateSet = false;
                    if (!conversationId) {
                        //TODO: handle error
                        console.error("conversationId undefined");
                        return;
                    }
                    handleChatRequest(this.extensionContext, webviewView.webview, { ...userMessagePayload, id: conversationId }, () => {
                        // Stream completed with sucess
                        // We're saving in file system only after streaming
                        this.updateExtensionState((prev) => {
                            return {
                                ...prev, workspace: {
                                    ...prev.workspace,
                                    streamState: "NONE"
                                }
                            }
                        });

                        const historyPayload: HistoryWorkerPayload = {
                            kind: "UPDATE",
                            newMessages: [fullMessage as MessageType],
                            id: conversationId,
                            extensionFsPath: this.extensionContext.extensionUri.fsPath
                        };

                        historyHandler(this.extensionContext, webviewView.webview, historyPayload, () => {
                        }, (error) => {

                        })
                    },
                        (chunk) => {
                            // Currently Streaming
                            fullMessage = streamChunkToMessage(chunk, fullMessage);
                            if (!streamStateSet) {
                                this.updateExtensionState((prev) => {
                                    return {
                                        ...prev, workspace: {
                                            ...prev.workspace,
                                            streamState: "STREAMING",
                                            messages: [...prev.workspace.messages, fullMessage as MessageType]
                                        }
                                    }
                                });
                                streamStateSet = true;
                            }
                            else {
                                this.updateExtensionState((prev) => {
                                    return {
                                        ...prev, workspace: {
                                            ...prev.workspace,
                                            messages: [...prev.workspace.messages.slice(0, -1), fullMessage as MessageType]
                                        }
                                    }
                                });

                            }
                        }, (error) => {
                            // Error during stream
                            this.updateExtensionState((prev) => {
                                return {
                                    ...prev, workspace: {
                                        ...prev.workspace,
                                        streamState: "NONE"
                                    }
                                }
                            });
                            console.error("__CHUNK_ERROR__", error);
                        });
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