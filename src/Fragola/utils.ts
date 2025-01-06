import * as vscode from "vscode";
import { inTypeUnion } from "../workers/types";

export const joinAsWebViewUri = (webView: vscode.Webview, extensionUri: vscode.Uri, ...paths: string[]) => {
    return webView.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...paths));
};

export const _join = (extensionUri: vscode.Uri, ...paths: string[]) => {
    return vscode.Uri.joinPath(extensionUri, ...paths);
};

export const createUtils = <T>(webview: vscode.Webview, extensionUri: vscode.Uri) => {
    return {
        joinAsWebViewUri: (...paths: string[]) => joinAsWebViewUri(webview, extensionUri, ...paths),
        join: (...paths: string[]) => _join(extensionUri, ...paths),
        postMessage: (message: { type: inTypeUnion, data: T, id?: string }) => {
            return webview.postMessage(message);
        }
    };
};