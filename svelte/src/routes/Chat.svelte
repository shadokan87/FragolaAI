<script lang="ts">
    import "../app.scss";
    import ChatFooter from "../lib/ChatFooter.svelte";
    import {
        extensionState,
        LLMMessagesRendererCache,
        type renderer,
        type RendererLike,
    } from "../store/chat.svelte";
    import Flex from "../lib/Flex.svelte";
    import RenderChatReader from "../lib/RenderChatReader.svelte";
    import { NONE_SENTINEL } from "../../../common";

    let rendererValue = $state<RendererLike[] | undefined>(undefined);
    $effect(() => {
        rendererValue = LLMMessagesRendererCache.value.get(
            extensionState.value.workspace.ui.conversationId,
        );
    });
</script>

<main class="chat-grid">
    <div class="chat-messages">
        {#if extensionState.value.workspace.ui.conversationId != NONE_SENTINEL}
            <RenderChatReader renderer={rendererValue} />
        {/if}
    </div>
    <div class="chat-footer">
        <ChatFooter />
    </div>
</main>

<style lang="scss">
    .chat-grid {
        display: grid;
        grid-template-rows: 1fr auto;
        max-height: 100vh;
        overflow-y: hidden;
    }

    .chat-messages {
        overflow-y: scroll;
    }
</style>
