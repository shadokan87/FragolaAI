<script lang="ts">
    import "../app.scss";
    import ChatFooter from "../lib/ChatFooter.svelte";
    import {
        extensionState,
        LLMMessagesRendererCache,
        type renderer,

        type RendererLike

    } from "../store/chat.svelte";
    import RenderChatReader from "../lib/RenderChatReader.svelte";
    import { NONE_SENTINEL } from "../../../common";

    let rendererValue = $state<RendererLike[] | undefined>(undefined)
    // let rendererValue = $derived<RendererLike[] | undefined>(LLMMessagesRendererCache.value.get(extensionState.value.workspace.ui.conversationId))
    $effect(() => {
        rendererValue = LLMMessagesRendererCache.value.get(extensionState.value.workspace.ui.conversationId);
        // console.log("__CACHE_UPDATE__", LLMMessagesRendererCache.value);
    });
</script>

<main class="chat-grid">
    <div class="chat-messages">
        {#if extensionState.value.workspace.ui.conversationId != NONE_SENTINEL}
            <RenderChatReader renderer={rendererValue} />
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