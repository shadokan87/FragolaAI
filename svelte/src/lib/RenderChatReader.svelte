<script lang="ts">
    import type { Marked, Token, TokensList } from "marked";
    import {
        extensionState,
        type renderedByComponent,
        type RendererLike,
    } from "../store/chat.svelte";
    import Divider from "./Divider.svelte";
    import Dotloading from "./Dotloading.svelte";
    import { InteractionMode, type MessageExtendedType } from "../../../common";
    import Button from "./Button.svelte";
    import { RiPlayCircleLine } from "svelte-remixicon";
    import ToolRole from "./llmWidgets/toolRole.svelte";
    import ToolCall from "./llmWidgets/ToolCall.svelte";

    export interface props {
        renderer: RendererLike[] | undefined;
    }
    const { renderer }: props = $props();
    $effect(() => {
        console.log("__RENDER__", renderer);
    });
</script>

{#if renderer && renderer.length}
    {#each renderer as renderer, i}
        {#if typeof renderer !== "string"}
            <div>
                {@html renderer.html}
                {#if extensionState.value.workspace.messages[i].role == "assistant" && extensionState.value.workspace.messages[i].tool_calls}
                    <ToolCall index={i} />
                {/if}
            </div>
        {:else if ["assistant", "user"].includes(extensionState.value.workspace.messages[i].role)}
            <p>{extensionState.value.workspace.messages[i].content}</p>
        {/if}
        {#if i < renderer.length - 1}
            <Divider />
        {/if}
        <!-- prettier-ignore -->
        {#if extensionState.value.workspace.messages[i].role != "user"
        && extensionState.value.workspace.streamState == "NONE"
        && (extensionState.lastMessageByRole("user", i) as MessageExtendedType | null)?.meta?.interactionMode == InteractionMode.PLAN
        && (i == renderer.length - 1 || !["tool", "assistant"].includes(extensionState.value.workspace.messages[i + 1].role))
        }
            <Button
                text={"Generate plan"}
                kind={"flex"}
                variant="ghost"
                icon={RiPlayCircleLine}
                iconProps={{ size: "16" }}
            />
        {/if}
    {/each}
    {#if extensionState.value.workspace.streamState == "STREAMING"}
        <span class="dot-loading-wrapper">
            <Dotloading />
        </span>
    {/if}
    <div class="message-placeholder"></div>
{/if}

<style lang="scss">
    .message-placeholder {
        height: 200px;
        background-color: transparent;
    }
    .dot-loading-wrapper {
        padding: var(--spacing-2);
        :global(.dot) {
            width: 0.5rem !important;
            height: 0.5rem !important;
        }
    }
</style>
