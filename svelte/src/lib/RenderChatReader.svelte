<script lang="ts">
    import type { Marked, Token, TokensList } from "marked";
    import { chatStreaming, extensionStateStore, type chatReader, type noRenderer, type renderer } from "../store/chat.svelte";
    import Divider from "./Divider.svelte";

    export interface props {
        reader: chatReader | undefined;
    }
    const { reader = $bindable() }: props = $props();
</script>
<p>{"loaded length: " + reader?.loaded.length}</p>
{#if reader && reader.renderer.length}
    {#each reader.renderer as renderer, i}
    <p>{`${reader.renderer.length}`}</p>
        {#if typeof renderer !== 'string'}
            <div>
                {@html renderer.html}
            </div>
        {/if}
        {#if i < reader.renderer.length - 1}
            <Divider />
        {/if}
    {/each}
{/if}