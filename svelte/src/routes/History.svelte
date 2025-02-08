<script lang="ts">
    import Button from "../lib/Button.svelte";
    import Flex from "../lib/Flex.svelte";
    import Typography from "../lib/Typography.svelte";
    import { extensionState } from "../store/chat.svelte";
    import type { ExtensionState, HistoryIndex } from "../../../common";
    import { codeStore as codeApi } from "../store/vscode";
    import { type payloadTypes } from "../../../common";
    import ConversationLabel from "../lib/ConversationLabel.svelte";
</script>

<Flex justifyCenter>
    <Typography>{"Conversation history"}</Typography>
</Flex>
<Flex _class={"history-container"} gap={"var(--spacing-1)"}>
    {#each extensionState.value.workspace.historyIndex as history}
        <ConversationLabel history={history} />
    {/each}
</Flex>

<style lang="scss">
    :global(.history-container) {
        padding-top: var(--spacing-1);
    }
    :global(.history-btn) {
        width: inherit !important;
        padding: var(--spacing-4);
    }
</style>
