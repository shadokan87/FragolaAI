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
