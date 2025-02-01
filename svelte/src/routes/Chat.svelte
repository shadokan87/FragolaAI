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
    import Dotloading from "../lib/Dotloading.svelte";

    let rendererValue = $state<RendererLike[] | undefined>(undefined);
    $effect(() => {
        rendererValue = LLMMessagesRendererCache.value.get(
            extensionState.value.workspace.ui.conversationId,
        );
    });
</script>

<Flex _class="chat-grid">
    <div class="chat-messages">
        {#if extensionState.value.workspace.ui.conversationId != NONE_SENTINEL}
            <RenderChatReader renderer={rendererValue} />
        {/if}
    </div>
    <div class="chat-footer">
        <ChatFooter />
    </div>
</Flex>

<style lang="scss">
    :global(.chat-grid) {
        max-height: 100vh;
        overflow-y: hidden;
    }
    .chat-footer {
        padding: var(--spacing-2)
    }

    .chat-messages {
        overflow-y: scroll;
        padding: var(--spacing-4)
    }
</style>
