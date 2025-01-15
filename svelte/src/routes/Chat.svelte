<script lang="ts">
    import "../app.scss";
    import ChatFooter from "../lib/ChatFooter.svelte";
    import {
        extensionStateStoreInitialized as extensionState,
        LLMMessagesRendererCache,
        type ChatView,
    } from "../store/chat.svelte";
    import RenderChatReader from "../lib/RenderChatReader.svelte";
    import { NONE_SENTINEL } from "../../../common";

    let reader: ChatView | undefined = $state(undefined);
    $effect(() => {
        const { conversationId } = $extensionState.workspace.ui;
        if (conversationId != NONE_SENTINEL) {
            reader = LLMMessagesRendererCache.getCache.get(conversationId);
            if (!reader) {
                // TODO: handle error
                console.error("reader undefined but expected value");
            }
        } else
            reader = undefined;
    });
</script>

<main class="chat-grid">
    <div class="chat-messages">
        {#if $extensionState.workspace.ui.conversationId != NONE_SENTINEL}
            <RenderChatReader bind:reader />
        {/if}
    </div>
    <ChatFooter />
</main>

<style lang="scss">
    .chat-grid {
        display: grid;
        grid-template-rows: 1fr auto;
        height: inherit;
    }
    .chat-messages {
        overflow-y: auto;
        background-color: --vscode-editor-background;
    }
</style>