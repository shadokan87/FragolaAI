<script lang="ts">
    import {
        Lexer,
        Marked,
        marked,
        type MarkedExtension,
        type MarkedOptions,
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
    import {
        codeStore as codeApi,
        codeStore,
        colorTheme,
    } from "../store/vscode";

    import { v4 } from "uuid";
    import type { basePayload, outTypeUnion } from "../../../src/workers/types";
    import { chatStreaming, codeBlockHighlight, extensionStateStore } from "../store/chat.svelte";
    import RenderChatReader from "../lib/RenderChatReader.svelte";

    const markedInstance = new Marked().use({
        renderer: {
            code(token: Tokens.Code) {
                const el = document.createElement("code-block");
                const id: string | undefined = (token as any)['id'];
                if (id) {
                    const content = codeBlockHighlight().get(id);
                    el.setAttribute("content", content ? content : "");
                }
                el.setAttribute("lang", token.lang || "");
                // el.setAttribute("content", token.text);
                return el.outerHTML;
            },
        },
    });
    let markdown = $state("");
    let tokens: TokensList | [] = $state.raw([]);
    let html = $derived(markedInstance.parser(tokens));

    async function setupMockStreaming() {
        const walkTokens = async (
            token: Token,
            index: number,
        ) => {
            if (token.type === "code") {
                if (
                    tokens[index] &&
                    tokens[index].type == "code" &&
                    (tokens[index] as any)["id"]
                ) {
                    (token as any)["id"] = (tokens[index] as any)["id"];
                } else (token as any)["id"] = v4();
                $codeApi?.postMessage({
                    type: "syntaxHighlight",
                    data: token.text,
                    id: (token as any)["id"],
                });
            }
        };
        let index = 0;
        const mock: chunckType[] = markdown_code_snippet as chunckType[];

        const interval = setInterval(async () => {
            if (index >= mock.length) {
                console.log("__TOKENS__", tokens);
                clearInterval(interval);
                return;
            }
            const chunk = mock[index];
            markdown += chunk.choices[0].delta.content || "";

            const newTokens = markedInstance.Lexer.lex(markdown);
            await Promise.all(
                newTokens.map((token, index) =>
                    walkTokens(token, index),
                ),
            );
            tokens = newTokens;
            console.log("__TOKENS__", tokens);
            index++;
        }, 100);
    }

    onMount(() => {
        // if (markdown.length === 0) {
        //     setupMockStreaming();
        // }
    });
</script>

<main class="chat-grid">
    <div class="chat-messages">
        {#if $extensionStateStore?.chat.id}
            <RenderChatReader markedInstance={markedInstance} id={$extensionStateStore.chat.id}/>
        {/if}
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
