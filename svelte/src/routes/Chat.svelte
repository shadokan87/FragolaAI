<script lang="ts">
    import "../app.scss";
    import ChatFooter from "../lib/ChatFooter.svelte";
    import {
        chatStreaming,
        codeBlockHighlight,
        extensionStateStoreInitialized as extensionState,
        TMP_READER_SENTINEL,
        type chatReader,
    } from "../store/chat.svelte";
    import RenderChatReader from "../lib/RenderChatReader.svelte";
    import { NONE_SENTINEL } from "../../../common";

    let reader: chatReader | undefined = $state(undefined);
    $effect(() => {
        reader =
            ($extensionState.workspace.ui.conversationId != NONE_SENTINEL &&
                chatStreaming.readers.get(
                    $extensionState.workspace.ui.conversationId,
                )) ||
            undefined;
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