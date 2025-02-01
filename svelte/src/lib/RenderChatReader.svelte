<script lang="ts">
    import type { Marked, Token, TokensList } from "marked";
    import {
        extensionState,
        type renderedByComponent,
        type RendererLike,
    } from "../store/chat.svelte";
    import Divider from "./Divider.svelte";
    import Dotloading from "./Dotloading.svelte";

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
            </div>
        {:else}
            <p>{extensionState.value.workspace.messages[i].content}</p>
            <!-- <p>{renderer.messages[i].content}</p> -->
        {/if}
        {#if i < renderer.length - 1}
            <Divider />
        {/if}
    {/each}
    {#if extensionState.value.workspace.streamState == "STREAMING"}
        <span class="dot-loading-wrapper">
            <Dotloading />
        </span>
    {/if}
    <!-- {#if extensionState.value.workspace.streamState != "STREAMING"} -->
        <div class="message-placeholder"></div>
    <!-- {/if} -->
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
