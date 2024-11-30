import * as vscode from 'vscode';
import { join } from "path";
import { readFileSync, writeFile } from 'fs';
import { readdir } from 'fs/promises';
import { handleChatRequest } from './handlers/chatRequest.ts';
import { ChatWorkerPayload } from './workers/chat/chat.worker.ts';
import { FragolaClient } from './Fragola/Fragola.ts';
import markdown_code_snippet from "./test/streamMocks/markdown_code_snippet.json";
import knex from 'knex';
import { config } from 'dotenv';
import { chunckType, defaultExtensionState, extensionState } from '@types';
import { inTypeUnion } from './workers/types.ts';
import OpenAI from 'openai';

console.log(process.env);

const joinAsWebViewUri = (webView: vscode.Webview, extensionUri: vscode.Uri, ...paths: string[]) => {
    return webView.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...paths));
};

const _join = (webView: vscode.Webview, extensionUri: vscode.Uri, ...paths: string[]) => {
    return vscode.Uri.joinPath(extensionUri, ...paths);
};

export const createUtils = <T>(webview: vscode.Webview, extensionUri: vscode.Uri) => {
    return {
        joinAsWebViewUri: (...paths: string[]) => joinAsWebViewUri(webview, extensionUri, ...paths),
        join: (...paths: string[]) => _join(webview, extensionUri, ...paths),
        postMessage: (message: {type: inTypeUnion, data: T, id?: string}) => {
            return webview.postMessage(message);
        }
    };
};

const replacePlaceHolders = (content: string, utils: ReturnType<typeof createUtils>, svelteBuildOutputLocation: string[]): string | undefined => {
    const matchAll = [...content.matchAll(/\"\/__VSCODE_URL__/g)];
    if (matchAll.length === 0) return undefined;

    const toReplace: { subString: string, uri: vscode.Uri }[] = [];

    for (const match of matchAll) {
        const stringStart = match.index! + 1;
        const stringEnd = content.indexOf("\"", stringStart);
        let subString = content.substring(stringStart, stringEnd);
        const webViewUri = utils.joinAsWebViewUri(
            ...svelteBuildOutputLocation,
            ...subString.substring("/__VSCODE_URL__".length).split('\n')
        );
        toReplace.push({ subString, uri: webViewUri });
    }

    return toReplace.reduce((content, replace) =>
        content.replace(replace.subString, `${replace.uri}`),
        content
    );
};

const processJsFiles = async (extensionUri: vscode.Uri, utils: ReturnType<typeof createUtils>) => {
    const svelteBuildOutputLocation = ["svelte", "dist"];
    const assetsPath = join(extensionUri.fsPath, "svelte", "dist", "assets");

    const files = await readdir(assetsPath, { encoding: "utf-8" })
        .then(files => files.filter(file => file.startsWith("index") && file.endsWith(".js")));

    files.forEach(async fileName => {
        const filePath = join(assetsPath, fileName);
        let content = readFileSync(filePath).toString();
        const replacedJs = replacePlaceHolders(content, utils, svelteBuildOutputLocation);

        if (replacedJs) {
            writeFile(filePath, replacedJs, (err) => {
                if (err) {
                    console.error(err.message);
                    process.exit(1);
                }
            });
        }
    });
};

const createWebviewContent = (extensionUri: vscode.Uri, utils: ReturnType<typeof createUtils>): string => {
    const svelteBuildOutputLocation = ["svelte", "dist"];
    const htmlUriPath = join(extensionUri.fsPath, "svelte", "dist", "index.html");
    let htmlContent = readFileSync(htmlUriPath).toString();
    return replacePlaceHolders(htmlContent, utils, svelteBuildOutputLocation) || htmlContent;
};

const resolveWebview = (
    webviewView: vscode.WebviewView,
    extensionUri: vscode.Uri
) => {
    if (!webviewView.webview.html) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(extensionUri, "svelte"),
                vscode.Uri.joinPath(extensionUri, "src", "data")
            ]
        };

        const utils = createUtils(webviewView.webview, extensionUri);
        processJsFiles(extensionUri, utils);
        webviewView.webview.html = createWebviewContent(extensionUri, utils).replace(/__VSCODE_CSP_SOURCE__/g, webviewView.webview.cspSource);
    }
};

// Track the visibility state of the chat view
let isChatViewVisible = false;

const toggleChatView = async () => {
    if (isChatViewVisible) {
        // Hide the view
        await vscode.commands.executeCommand('workbench.action.closeSidebar');
        isChatViewVisible = false;
    } else {
        // Show the view
        await vscode.commands.executeCommand('workbench.view.extension.fragola-ai-view');
        isChatViewVisible = true;
    }
};

export async function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "fragola-ai" is now active!');
    const { codeToHtml, bundledThemesInfo } = await import('shiki');
    //TODO:
    // detect user colorscheme extensions, get the package json for the tokenColors field and send it to front-end, front-end will use shiki createHighlighter to highlight

    // To get theme kind (light, dark etc)
    const theme = vscode.window.activeColorTheme;

    // console.log("__THEME__: ", currentThemeId);
    // Register the webview provider
    const provider: vscode.WebviewViewProvider = {
        async resolveWebviewView(
            webviewView: vscode.WebviewView,
            _context: vscode.WebviewViewResolveContext,
            _token: vscode.CancellationToken,
        ) {
            resolveWebview(webviewView, context.extensionUri);
            const utils = createUtils(webviewView.webview, context.extensionUri);
            config({path: utils.join(".env").fsPath})
            console.log("key: ", process.env.OPENROUTER_API_KEY);
            function restoreExtensionState(): extensionState {
                return defaultExtensionState;
            }
            let extensionState = restoreExtensionState();
            const fragola = new FragolaClient.createInstance(utils, new FragolaClient.Chat({...extensionState.chat}));

            // Subscribe to chat state changes
            fragola.chat.state$.subscribe(chatState => {
                const newState = {...extensionState, chat: chatState};
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
                })
            }
            const updateState = (newState: extensionState) => {
                extensionState = newState;
                webviewView.webview.postMessage({
                    type: "stateUpdate",
                    data: extensionState
                })
            }

            webviewView.webview.onDidReceiveMessage(async message => {
                switch (message.type) {
                    case 'webviewReady':
                        sendThemeInfo(currentThemeId);
                        break;
                    case 'alert':
                        vscode.window.showInformationMessage(message.text);
                        break;
                    case 'chatRequest':
                        console.log("#br1", message.data);
                        if (extensionState.chat.isTmp) {
                            // Create a new empty chat, will generate a new id and set it as current
                            await fragola.chat.create([], "test");
                        }
                        const userMessage = message as ChatWorkerPayload;
                        userMessage.id = fragola.chat.getState().id;
                        // await fragola.chat.addMessage({
                        //     choices: [{
                        //         delta: {
                        //             content: userMessage.data.prompt,
                        //             role: "user",
                        //         },
                        //         finish_reason: null,
                        //         index: 0
                        //     }]
                        // })
                        const newMessage = await handleChatRequest(context, webviewView.webview, message as ChatWorkerPayload);
                        console.log("!msg", newMessage);
                        break;
                    case "syntaxHighlight": {
                        const shikiInfo = bundledThemesInfo.find(
                            (theme) => theme.displayName == currentThemeId,
                        );
                        const html = shikiInfo ? await codeToHtml(message.data, {
                            theme: shikiInfo.id,
                            lang: "c"
                        }) : message.data;

                        postMessage({
                            type: "shikiHtml",
                            id: message.id,
                            data: html
                        })
                        break;
                    }
                    case "online": {
                        postMessage({type: "stateUpdate", data: extensionState})
                        sendThemeInfo(currentThemeId);
                        return;
                    }
                }
            });

            // Update visibility state when the view becomes visible
            webviewView.onDidChangeVisibility(() => {
                isChatViewVisible = webviewView.visible;
            });

            // Listen for theme changes
            vscode.window.onDidChangeActiveColorTheme(e => {
                currentThemeId = vscode.workspace.getConfiguration('workbench').get('colorTheme') as string;
                sendThemeInfo(currentThemeId);
            });
        }
    };

    // Register sidebar view
    const sidebarView = vscode.window.registerWebviewViewProvider(
        'fragola-ai-sidebar',
        provider
    );

    context.subscriptions.push(sidebarView);

    // Register command for keyboard shortcut with toggle functionality
    const openChatCommand = vscode.commands.registerCommand('fragola-ai.openChat', toggleChatView);
    context.subscriptions.push(openChatCommand);
}

export function deactivate() { }