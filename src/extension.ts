import * as vscode from 'vscode';
import { join } from "path";
import { readFileSync, writeFile } from 'fs';
import { readdir } from 'fs/promises';
import { handleChatRequest } from './handlers/chatRequest';

const joinAsWebViewUri = (webView: vscode.Webview, extensionUri: vscode.Uri, ...paths: string[]) => {
    return webView.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...paths));
};

const createUtils = (webview: vscode.Webview, extensionUri: vscode.Uri) => {
    return {
        joinAsWebViewUri: (...paths: string[]) => joinAsWebViewUri(webview, extensionUri, ...paths)
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
    webviewView.webview.options = {
        enableScripts: true,
        localResourceRoots: [
            vscode.Uri.joinPath(extensionUri, "svelte")
        ]
    };

    const utils = createUtils(webviewView.webview, extensionUri);
    processJsFiles(extensionUri, utils);
    webviewView.webview.html = createWebviewContent(extensionUri, utils);
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

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "fragola-ai" is now active!');

    // Register the webview provider
    const provider: vscode.WebviewViewProvider = {
        resolveWebviewView(
            webviewView: vscode.WebviewView,
            _context: vscode.WebviewViewResolveContext,
            _token: vscode.CancellationToken,
        ) {
            resolveWebview(webviewView, context.extensionUri);

            webviewView.webview.onDidReceiveMessage(async message => {
                switch (message.command) {
                    case 'alert':
                        vscode.window.showInformationMessage(message.text);
                        return;
                    case 'chat':
                        await handleChatRequest(webviewView.webview, message.prompt);
                        return ;
                }
            });

            // Update visibility state when the view becomes visible
            webviewView.onDidChangeVisibility(() => {
                isChatViewVisible = webviewView.visible;
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

export function deactivate() {}