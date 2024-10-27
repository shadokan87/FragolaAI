// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {join} from "path";
import { readFileSync } from 'fs';

const joinAsWebViewUri = (webView: vscode.Webview, extensionUri: vscode.Uri, ...paths: string[]) => {
	return webView.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...paths));
};

const createUtils = (panel: vscode.WebviewPanel, context: vscode.ExtensionContext) => {
	return {
		joinAsWebViewUri: (...paths: string[]) => joinAsWebViewUri(panel.webview, context.extensionUri, ...paths)
	};
};
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "fragola-ai" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('fragola-ai.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		// vscode.window.showInformationMessage('Hello World from fragolaAI!');
		 const panel = vscode.window.createWebviewPanel(
        'catCoding',
        'Cat Coding',
        vscode.ViewColumn.One,
        {
			enableScripts: true,
			localResourceRoots: [
				vscode.Uri.joinPath(context.extensionUri, "svelte")
			]
		}
      );
	  const utils = createUtils(panel, context);
	  /*
	  	Here we will load the original html and locate the urls that contain the __VSCODE_URL__ placeholder.
		We will replace these placeholders by the correct webViewUri path.
		This will alow urls to be loaded correctly by vscode
	  */

	  const svelteBuildOutputLocation = ["svelte", "dist"];
	  // Load original html
	  const htmlUriPath = join(context.extensionPath, "svelte", "dist", "index.html");
	  let htmlContent = readFileSync(htmlUriPath).toString();
	  // Locate every placeholders
	  const matchAll = [...htmlContent.matchAll(/\"\/__VSCODE_URL__/g)];
	  const toReplace: {subString: string, uri: vscode.Uri}[] = [];

	  for (const match of matchAll) {
		const stringStart = match.index + 1;
		const stringEnd = htmlContent.indexOf("\"", stringStart);
		let subString = htmlContent.substring(stringStart, stringEnd);
		const webViewUri = utils.joinAsWebViewUri(...svelteBuildOutputLocation, ...subString.substring("/__VSCODE_URL__".length).split('\n'));
		toReplace.push({subString, uri: webViewUri});
	  }

	  toReplace.forEach(replace => {
		htmlContent = htmlContent.replace(replace.subString, `${replace.uri}`);
	  });

	  console.log("!toReplace: ", toReplace);
	  console.log("!content: ", htmlContent);

      panel.webview.html = htmlContent;
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
