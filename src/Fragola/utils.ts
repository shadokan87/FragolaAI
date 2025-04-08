import * as vscode from "vscode";
import { inTypeUnion } from "../workers/types";
import { ExtensionState } from "@types";
import { defaultExtensionState } from "@utils";

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

export const copyStateWithoutRuntimeVariables = (state: ExtensionState) => {
    let result = structuredClone(state);
    result.workspace.streamState = defaultExtensionState.workspace.streamState;
    result.workspace.messages = defaultExtensionState.workspace.messages;
    result.workspace.ui.showHistory = defaultExtensionState.workspace.ui.showHistory
    return result;
};