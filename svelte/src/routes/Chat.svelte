<script lang="ts">
    import { marked, type Tokens } from "marked";
    import "../app.scss";
    import ChatFooter from "../lib/ChatFooter.svelte";
    import Flex from "../lib/Flex.svelte";
    import { onMount } from "svelte";
    import type { chunckType } from "../types";
    import markdown_code_snippet from "../../../src/test/streamMocks/markdown_code_snippet.json";
    import CodeBlock from "../lib/CodeBlock.svelte";
    onMount(() => {
        if (markdown.length > 0)
            return ;
        let index = 0;
        const mock: chunckType[] = markdown_code_snippet as chunckType[];
        const interval = setInterval(() => {
            if (index >= mock.length) {
                clearInterval(interval);
                return;
            }
            const chunk = mock[index];
            markdown += chunk.choices[0].delta.content || "";
            index++;
        }, 100);
        console.log("!mock", mock);
        // while (index < )
    });
    const renderer = {
        code(token: Tokens.Code) {
            console.log("__TOKEN__", token);
            return `<p>${JSON.stringify(token)}</p>`;
        }
    }
    marked.use({renderer})
    let markdown: string = $state(""); 
    let html = $derived(marked(markdown));
</script>

<main class="chat-grid">
    <div class="chat-messages">
        <CodeBlock lang="c" content="#include <unistd.h>\n write(1, 'a', 1)"/>
        <!-- {@html html} -->
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
