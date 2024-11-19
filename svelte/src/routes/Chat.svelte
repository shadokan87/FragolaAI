<script lang="ts">

    // // Ignore this function for now
    // function assignIdToCodeBlock(token: Token, id: string = v4()) {
    //     (token as any)["id"] = id;
    // }
    
    // // Ignore this function for now
    // function assignUuidToCodeBlocks(newTokens: TokensList) {
    //     let lastNewToken = newTokens[newTokens.length - 1];
    //     if (lastNewToken && lastNewToken.type == "code") {
    //         const isSameCodeBlock = newTokens.length == tokens.length;

    //         if (isSameCodeBlock) {
    //             const id: string = (tokens.at(-1) as any)["id"];
    //             assignIdToCodeBlock(lastNewToken, id);
    //         } else {
    //             assignIdToCodeBlock(lastNewToken);
    //         }
    //     }
    //     tokens = newTokens.map((token, index) => {
    //         const lastTokenFromState = tokens.at(-1);
    //         if (
    //             lastTokenFromState &&
    //             lastTokenFromState.type == "code" &&
    //             !(token as any)["id"] &&
    //             (lastTokenFromState as any)["id"]
    //         )
    //             assignIdToCodeBlock(token, (lastTokenFromState as any)["id"]);
    //         return token;
    //     }) as TokensList;
    // }
    import {
        Lexer,
        Marked,
        marked,
        type Token,
        type Tokens,
        type TokensList,
    } from "marked";
    import "../app.scss";
    import ChatFooter from "../lib/ChatFooter.svelte";
    import Flex from "../lib/Flex.svelte";
    import { onMount } from "svelte";
    import type { chunckType } from "../types";
    import markdown_code_snippet from "../../../src/test/streamMocks/markdown_code_snippet.json";
    import CodeBlock from "../lib/CodeBlock.svelte";
    import {codeStore as codeApi, colorTheme} from "../store/vscode";

    import { v4 } from "uuid";

    const markedInstance = $state(
        new Marked().use({
            renderer: {
                code(token: Tokens.Code) {
                    const el = document.createElement("code-block");
                    el.setAttribute("lang", token.lang || "");
                    el.setAttribute("content", token.text);
                    return el.outerHTML;
                },
            },
        }),
    );
    let markdown = $state("");
    let tokens: TokensList | [] = $state.raw([]);
    let html = $derived(markedInstance.parser(tokens));

    function setupMockStreaming() {
        let index = 0;
        const mock: chunckType[] = markdown_code_snippet as chunckType[];

        const interval = setInterval(() => {
            if (index >= mock.length) {
                // assignUuidToCodeBlocks(newTokens);
                clearInterval(interval);
                return;
            }
            const chunk = mock[index];
            markdown += chunk.choices[0].delta.content || "";

            const newTokens = markedInstance.Lexer.lex(markdown);
            // assignUuidToCodeBlocks(newTokens);
            tokens = newTokens;
            index++;
        }, 100);
    }

    onMount(() => {
        if (markdown.length === 0) {
            setupMockStreaming();
        }
    });
</script>

<main class="chat-grid">
    <div class="chat-messages">
        {@html html}
    </div>
    <ChatFooter />
</main>

<style lang="scss">
    .chat-grid {
        display: grid;
        grid-template-rows: 1fr auto;
        height: 100vh;
    }
    .chat-messages {
        overflow-y: auto;
        background-color: --vscode-editor-background;
    }
</style>
