import * as vscode from 'vscode';
import { join } from "path";
import { readFileSync, writeFile } from 'fs';
import { readdir } from 'fs/promises';
import { handleChatRequest } from './handlers/chatRequest.ts';
import { ChatWorkerPayload } from './workers/chat/chat.worker.ts';
import { FragolaClient } from './Fragola/Fragola.ts';
import markdown_code_snippet from "./test/streamMocks/markdown_code_snippet.json";
import knex from 'knex';

require('dotenv').config();
console.log(process.env);

const joinAsWebViewUri = (webView: vscode.Webview, extensionUri: vscode.Uri, ...paths: string[]) => {
    return webView.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...paths));
};

const _join = (webView: vscode.Webview, extensionUri: vscode.Uri, ...paths: string[]) => {
    return vscode.Uri.joinPath(extensionUri, ...paths);
};

export const createUtils = (webview: vscode.Webview, extensionUri: vscode.Uri) => {
    return {
        joinAsWebViewUri: (...paths: string[]) => joinAsWebViewUri(webview, extensionUri, ...paths),
        join: (...paths: string[]) => _join(webview, extensionUri, ...paths)
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
            const fragola = new FragolaClient.createInstance(utils);
            try {
                const id = await fragola.createChat(markdown_code_snippet as FragolaClient.chunckType[], "test");
                console.log("ID: ", id);
            } catch(e) {
                console.error(e);
            }
            // Color theme sync
            let currentThemeId = vscode.workspace.getConfiguration('workbench').get('colorTheme') as string;
            const sendThemeInfo = (data: string) => {
                webviewView.webview.postMessage({
                    type: "colorTheme",
                    data
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
                        await handleChatRequest(context, webviewView.webview, message as ChatWorkerPayload);
                        break;
                    case "syntaxHighlight": {
                        const shikiInfo = bundledThemesInfo.find(
                            (theme) => theme.displayName == currentThemeId,
                        );
                        const html = shikiInfo ? await codeToHtml(message.data, {
                            theme: shikiInfo.id,
                            lang: "c"
                        }) : message.data;

                        webviewView.webview.postMessage({
                            type: "shikiHtml",
                            id: message.id,
                            data: html
                        })
                        break;
                    }
                    case "online": {
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