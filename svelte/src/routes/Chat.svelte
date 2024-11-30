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
    import { codeBlockHighlight, extensionStateStore } from "../store/chat.svelte";
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
                return el.outerHTML;
            },
        },
    });
</script>

<main class="chat-grid">
    <div class="chat-messages">
        {#if $extensionStateStore?.chat.id}
            <RenderChatReader id={$extensionStateStore.chat.id}/>
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
