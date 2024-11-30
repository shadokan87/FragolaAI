<script lang="ts">
    import type { Marked, Token, TokensList } from "marked";
    import { chatStreaming, type chatReader } from "../store/chat.svelte";
    import Divider from "./Divider.svelte";

    export interface props {
        id: string;
    }

    const { id }: props = $props();
    let reader: chatReader | undefined = $state(undefined);
    $effect(() => {
        if (chatStreaming.update) {}
        reader = chatStreaming.readers.get(id)
    })
</script>

{#if reader && reader.renderer.length}
    {#each reader.renderer as renderer, i}
        <div>
            {@html renderer.html}
        </div>
        {#if i < reader.renderer.length - 1}
            <Divider />
        {/if}
    {/each}
{/if}