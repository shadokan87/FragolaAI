import * as vscode from "vscode";
import { createUtils } from "./utils";
import { readFileSync, writeFile } from 'fs';
import { readdir } from 'fs/promises';
import { join } from "path";

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

export const processJsFiles = async (extensionUri: vscode.Uri, utils: ReturnType<typeof createUtils>, sed?: Array<(jsFile: string) => string>) => {
    const svelteBuildOutputLocation = ["svelte", "dist"];
    const assetsPath = join(extensionUri.fsPath, "svelte", "dist", "assets");

    const files = await readdir(assetsPath, { encoding: "utf-8" })
        .then(files => files.filter(file => file.startsWith("index") && file.endsWith(".js")));

    files.forEach(async fileName => {
        const filePath = join(assetsPath, fileName);
        let content = readFileSync(filePath).toString();

        if (sed && sed.length) {
            for (const sedCallback of sed) {
                content = sedCallback(content);
            }

            writeFile(filePath, content, (err) => {
                if (err) {
                    console.error(err.message);
                    process.exit(1);
                }
            });
        }

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

export const createWebviewContent = (extensionUri: vscode.Uri, utils: ReturnType<typeof createUtils>): string => {
    const svelteBuildOutputLocation = ["svelte", "dist"];
    const htmlUriPath = join(extensionUri.fsPath, "svelte", "dist", "index.html");
    console.log("__HTML_URI__", htmlUriPath);
    let htmlContent = readFileSync(htmlUriPath).toString();
    return replacePlaceHolders(htmlContent, utils, svelteBuildOutputLocation) || htmlContent;
};