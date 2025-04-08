import * as vscode from "vscode";
import { createUtils, copyStateWithoutRuntimeVariables } from "../utils";
import { FragolaClient } from "../Fragola";
import { ExtensionState, InteractionMode, MentionKind, MessageExtendedType, MessageType, NONE_SENTINEL, payloadTypes } from "@types";
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
import { handleBuildRequest } from "../../handlers/buildRequest";
import { grepCodebase } from "../agentic/tools/navigation/grepCodebase";
import { readFileById } from "../agentic/tools/navigation/readFileById";
import { ChatCompletionSystemMessageParam } from "openai/resources";
import { BuildWorkerPayload } from "../../workers/build/build.worker";
import { handlePlanRequest } from "../../handlers/planRequest";
import { getEditorForFile } from "../../vscodeIntegration/integrationUtils";
import { createDecoration } from "../../vscodeIntegration/decoration";
import { createDiffForFile } from "../../vscodeIntegration/diff";
import { DIFF_VIEW_URI_SCHEME } from "../../vscodeIntegration/common";

type StateScope = "global" | "workspace";

export class FragolaVscode extends FragolaVscodeBase implements vscode.WebviewViewProvider {
    public extensionContext: vscode.ExtensionContext;
    private isChatViewVisible = false;
    private state$: BehaviorSubject<ExtensionState>;
    public tree: Tree;
    private prompts: Record<string, string> = {}
    // private treeService: TreeService;
    constructor(extensionContext: vscode.ExtensionContext) {
        super();
        this.extensionContext = extensionContext;
        this.registerCommands();
        this.registerOtherContext();
        this.state$ = new BehaviorSubject({ ...defaultExtensionState });
        this.tree = new Tree(vscode.workspace.workspaceFolders?.map((folder) => folder.uri.fsPath).at(0));
        this.initializeState();
        if (!this.tree.getCwd()) {
            //TODO: handle error
            console.error("Workspace init error");
            return;
        }
    }

    private loadPrompt(key: string, path: string) {
        const textFile = new TextFileSync(path);
        if (!textFile)
            throw new Error(`Open prompt at path: ${path} failed`);
        const content = textFile.read();
        if (!content)
            throw new Error(`Reading prompt at path: ${path} failed`);
        this.prompts[key] = content;
    }

    private async initializeState() {
        const workspaceEdit = new vscode.WorkspaceEdit();
        // const fileUri = vscode.Uri.file(join(this.tree.getCwd()!, "src/testFolder/test"));
        // const fileUri = vscode.Uri.file("src/testFolder/test");
        // console.log("Test file uri: ", fileUri);
        // workspaceEdit.createFile(fileUri, { overwrite: true, contents: new TextEncoder().encode("test file") });
        // await vscode.workspace.applyEdit(workspaceEdit);
        try {
            ["build", "planner"].forEach(agent => {
                this.loadPrompt(agent, join(this.extensionContext.extensionUri.fsPath, "src", "Fragola", "agentic", agent, "prompts", "defaultSys.md"))
            });
        } catch (e) {
            //TODO: handle error
            console.error(e);
        }
        console.log("Prompts: ", this.prompts);
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
            extensionState.workspace.ui.interactionMode = InteractionMode.BUILD; //TODO: remove this line
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

    private registerOtherContext() {
        const diffTextDocumentContentProvider = (() => new class implements vscode.TextDocumentContentProvider {
            provideTextDocumentContent(uri: vscode.Uri): string {
                return Buffer.from(uri.query, "base64").toString("utf-8")
            }
        })();
        this.extensionContext.subscriptions.push(
            vscode.workspace.registerTextDocumentContentProvider(DIFF_VIEW_URI_SCHEME, diffTextDocumentContentProvider),
        )
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
            console.log("_SENDING_STATE_", newState);
            webviewView.webview.postMessage({
                type: "stateUpdate",
                data: newState
            });
            if (newState.workspace.streamState != "STREAMING") {
                const [prevCopy, newCopy] = [copyStateWithoutRuntimeVariables(prev), copyStateWithoutRuntimeVariables(newState)];
                if (!isEqual(prevCopy.global, newCopy.global)) {
                    this.updateState("global", newCopy.global);
                }

                if (!isEqual(prevCopy.workspace, newCopy.workspace)) {
                    this.updateState("workspace", newCopy.workspace, "workspace");
                }
            }

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
                case "changeInteractionMode": {
                    const payload = message as payloadTypes.ui.changeInteractionMode;
                    this.updateExtensionState(prev => {
                        return {
                            ...prev,
                            workspace: {
                                ...prev.workspace,
                                ui: {
                                    ...prev.workspace.ui,
                                    interactionMode: payload.parameters.mode
                                }
                            }
                        }
                    })
                }
                case "deleteConversation": {
                    const payload = message as payloadTypes.action.deleteConversation;
                    await fragola.chat.deleteConversation(payload.parameters);
                    break;
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
                    const userMessage: MessageType = {
                        role: "user", content: (() => {
                            let result = "";
                            userMessagePayload.data.prompt.forEach(part => {
                                if (typeof part == "string")
                                    result += ` ${part}`;
                                else if (part.content && [MentionKind.FILE, MentionKind.FOLDER].includes(part.kind)) {
                                    result += ` \`${part.kind}:${part.content}\`  `
                                } else {
                                    // no-op
                                }
                            });
                            return result;
                        })()
                    };
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
                            //TODO: handle error
                            console.error(e);
                        }
                    }
                    let fullMessage: Partial<MessageType> = {};
                    let streamStateSet = false;
                    if (!conversationId) {
                        //TODO: handle error
                        console.error("conversationId undefined");
                        return;
                    }

                    const getSysPrompt = (): MessageType => {
                        let sysPromptRaw = (() => {
                            switch (this.state$.getValue().workspace.ui.interactionMode) {
                                case InteractionMode.BUILD: {
                                    return this.prompts["build"]
                                }
                                case InteractionMode.PLAN: {
                                    return this.prompts["planner"]
                                }
                                default: {
                                    console.error("Unhandled system prompt");
                                    return `ERROR`
                                    break;
                                }
                            }
                        })().replace("__TREE__", this.tree.resultString);
                        return { role: "system", content: sysPromptRaw };
                    };

                    const messages: MessageType[] = [getSysPrompt(), ...this.state$.getValue().workspace.messages.map(message => {
                        const { meta, ...rest } = message;
                        return rest;
                    })]

                    const handler = (() => {
                        const interactonMode = this.state$.getValue().workspace.ui.interactionMode;
                        if (interactonMode == InteractionMode.BUILD)
                            return handleBuildRequest;
                        else if (interactonMode == InteractionMode.PLAN)
                            return handlePlanRequest;
                        else
                            return handleChatRequest;
                    })();
                    // const handler =  [InteractionMode.BUILD, InteractionMode.PLAN].includes(this.state$.getValue().workspace.ui.interactionMode) ? handleBuildRequest : handleChatRequest;
                    const prevMessages = [...this.state$.getValue().workspace.messages];
                    let _newMessages: MessageType[] = [];
                    const runtimeSerialized: BuildWorkerPayload["data"]["runtimeSerialized"] = {
                        projectRoot: this.tree.getCwd()!, //TODO: remove '!'
                        idToPath: this.tree.idToPath
                    }
                    handler(this, webviewView.webview, { ...userMessagePayload, data: { ...userMessagePayload.data, messages, runtimeSerialized }, id: conversationId }, () => {
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
                            newMessages: _newMessages,
                            id: conversationId,
                            extensionFsPath: this.extensionContext.extensionUri.fsPath
                        };

                        historyHandler(this.extensionContext, webviewView.webview, historyPayload, () => {
                        }, (error) => {

                        })
                    },
                        (newMessages) => {
                            _newMessages = newMessages;
                            // Currently Streaming
                            this.updateExtensionState((prev) => {
                                return {
                                    ...prev, workspace: {
                                        ...prev.workspace,
                                        messages: [...prevMessages, ...newMessages],
                                        streamState: "STREAMING"
                                    }
                                }
                            });
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