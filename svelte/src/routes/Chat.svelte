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
    import { chatStreaming, codeBlockHighlight, extensionStateStore, TMP_READER_SENTINEL, type chatReader } from "../store/chat.svelte";
    import RenderChatReader from "../lib/RenderChatReader.svelte";

    let chatId: string | undefined = $state(undefined);
    let reader: chatReader | undefined = $state(undefined);
    $effect(() => {
        if ($extensionStateStore?.chat.isTmp)
            chatId = TMP_READER_SENTINEL;
        else
            chatId = $extensionStateStore?.chat.id;
        reader = chatId && chatStreaming.readers.get(chatId) || undefined;
        console.log("__CHAT_ID__", chatId);
    });
</script>

<main class="chat-grid">
    <div class="chat-messages">
        {#if chatId}
            <RenderChatReader bind:reader={reader}/>
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
