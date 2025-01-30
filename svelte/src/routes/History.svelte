<script lang="ts">
    import Button from "../lib/Button.svelte";
    import Flex from "../lib/Flex.svelte";
    import Typography from "../lib/Typography.svelte";
    import { extensionState } from "../store/chat.svelte";
    import type { ExtensionState, HistoryIndex } from "../../../common";
    import { codeStore as codeApi } from "../store/vscode";
    import { type payloadTypes } from "../../../common";
    function handleHistoryClick(history: HistoryIndex) {
        const payload: payloadTypes.action.conversationClick = {
            type: "actionConversationClick",
            parameters: {
                conversationId: history.id
            }
        }
        $codeApi?.postMessage(payload);
        console.log("clicked on: ", history);
    }
</script>

<Flex justifyCenter>
    <Typography>{"Conversation history"}</Typography>
</Flex>
<Flex _class={"history-container"} gap={"var(--spacing-1)"}>
    {#each extensionState.value.workspace.historyIndex as history}
        <Button
            variant={"ghost"}
            kind={"custom"}
            onclick={() => handleHistoryClick(history)}
            class="... history-btn"
        >
            <Flex>
                <Typography>{history.meta.label || "(No label)"}</Typography>
            </Flex>
        </Button>
    {/each}
</Flex>

<style lang="scss">
    .history-container {
        width: 100%;
    }
    :global(.history-btn) {
        width: inherit !important;
    }
    // .button-wrapper {
    //     width: 100%;
    //     > :global(.btn) {
    //         width: 100%;
    //     }
    // }
</style>
