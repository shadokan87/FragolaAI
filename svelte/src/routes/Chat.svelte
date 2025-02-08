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
    let autoScrollIntervalId = $state(-1);
    let chatContainer: HTMLDivElement;
    const scrollToBottom = () => {
        if (chatContainer) {
            chatContainer.scrollTo({
                top: chatContainer.scrollHeight,
                behavior: "smooth",
            });
        }
    };

    $effect(() => {
        rendererValue = LLMMessagesRendererCache.value.get(
            extensionState.value.workspace.ui.conversationId,
        );
        if (
            extensionState.value.workspace.streamState == "STREAMING" &&
            autoScrollIntervalId == -1
        ) {
            autoScrollIntervalId = Number(
                setInterval(() => scrollToBottom(), 10),
            );
        }
        if (
            extensionState.value.workspace.streamState != "STREAMING" &&
            autoScrollIntervalId != -1
        ) {
            clearInterval(autoScrollIntervalId);
            autoScrollIntervalId = -1;
        }
    });
</script>

<Flex _class="chat-grid">
    <div bind:this={chatContainer} class="chat-messages">
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
        padding: var(--spacing-2);
    }

    .chat-messages {
        overflow-y: scroll;
        padding: var(--spacing-4);
        height: 100vh;
    }
</style>
