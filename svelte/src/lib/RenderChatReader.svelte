<script lang="ts">
    import type { Marked, Token, TokensList } from "marked";
    import {
        chatStreaming,
        extensionStateStore,
        type chatReader,
        type renderedByComponent,
        type renderer,
    } from "../store/chat.svelte";
    import Divider from "./Divider.svelte";

    export interface props {
        reader: chatReader | undefined;
    }
    const { reader = $bindable() }: props = $props();
</script>

{#if reader && reader.renderer.length}
    {#each reader.renderer as renderer, i}
        {#if typeof renderer !== "string"}
            <div>
                {@html renderer.html}
            </div>
        {:else}
            <p>{reader.loaded[i].content}</p>
        {/if}
        {#if i < reader.renderer.length - 1}
            <Divider />
        {/if}
    {/each}
{/if}
