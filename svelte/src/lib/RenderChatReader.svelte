<script lang="ts">
    import type { Marked, Token, TokensList } from "marked";
    import {
        extensionStateStore,
        type ChatView,
        type renderedByComponent,
        type renderer,
    } from "../store/chat.svelte";
    import Divider from "./Divider.svelte";

    export interface props {
        reader: ChatView | undefined;
    }
    const { reader }: props = $props();
</script>

{#if reader && reader.renderer.length}
    {#each reader.renderer as renderer, i}
        {#if typeof renderer !== "string"}
            <div>
                {@html renderer.html}
            </div>
        {:else}
            <p>{reader.messages[i].content}</p>
        {/if}
        {#if i < reader.renderer.length - 1}
            <Divider />
        {/if}
    {/each}
{/if}
