<script lang="ts">
    import { RiChatDeleteLine, RiCheckLine } from "svelte-remixicon";
    import type { HistoryIndex, payloadTypes } from "../../../common";
    import Flex from "./Flex.svelte";
    import Typography from "./Typography.svelte";
    import Button from "./Button.svelte";
    import { createTimeout } from "../store/ui.svelte";
    import { codeStore as codeApi } from "../store/vscode";
    import ToolTip from "./ToolTip.svelte";

    let showDeleteConfirmation = createTimeout();
    let { history }: { history: HistoryIndex } = $props();
    let i = 0;
    function handleHistoryClick(history: HistoryIndex) {
        const payload: payloadTypes.action.conversationClick = {
            type: "actionConversationClick",
            parameters: {
                conversationId: history.id,
            },
        };
        $codeApi?.postMessage(payload);
    }
    function handleChatDeletionConfirmClick(history: HistoryIndex) {
        const payload: payloadTypes.action.deleteConversation = {
            type: "deleteConversation",
            parameters: {
                conversationId: history.id,
            },
        };
        $codeApi?.postMessage(payload);
    }
</script>

<Button
    kind="custom"
    variant="none"
    onclick={() => {
        handleHistoryClick(history);
    }}
    class={"conversation-label"}
>
    <Flex row justifyBetween>
        <div>
            <Typography>{history.meta.label || "(No label)"}</Typography>
        </div>
        {#if showDeleteConfirmation.isActive}
            <Button
                kind="flex"
                text={"Click again to confirm"}
                variant={"ghost"}
                icon={RiCheckLine}
                iconProps={{ size: "16" }}
                onclick={(e) => {
                    e?.preventDefault();
                    e?.stopPropagation();
                    handleChatDeletionConfirmClick(history);
                }}
                class="... delete-conversation"
            />
        {:else}
            <ToolTip text={"Delete conversation"}>
                <Button
                    kind="flex"
                    text={""}
                    variant={"ghost"}
                    icon={RiChatDeleteLine}
                    iconProps={{ size: "16" }}
                    onclick={(e) => {
                        e?.preventDefault();
                        e?.stopPropagation();
                        showDeleteConfirmation.trigger();
                    }}
                    class="... delete-conversation"
                />
            </ToolTip>
        {/if}
    </Flex>
</Button>

<style lang="scss">
    // :global(.delete-conversation) {
    //     z-index: 2;
    // }
    :global(.conversation-label) {
        padding: var(--spacing-4);
        background-color: transparent;
        border: none;
        cursor: pointer;
        &:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
    }
</style>
