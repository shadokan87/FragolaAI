<script lang="ts">
    import type { Marked, Token, TokensList } from "marked";
    import { chatStreaming, type chatReader } from "../store/chat.svelte";
    import { v4 } from "uuid";
    import { codeStore as codeApi } from "../store/vscode";
    import type { chunckType } from "../types";
    // import { chatStreaming } from "../store/chat.svelte";

    export interface props {
        markedInstance: Marked;
        id: string;
        // messages: chatReader['loaded'];
    }

    const { markedInstance, id }: props = $props();
    let reader: chatReader | undefined = $state(undefined);
    $effect(() => {
        if (chatStreaming.update) {}
        reader = chatStreaming.readers.get(id)
    })
</script>

{#if reader && reader.renderer.length}
    {#each reader.renderer as renderer}
        <div>
            {@html renderer.html}
        </div>
    {/each}
{/if}
<!-- {#each renders as render}
    <div>
        {@html render.html}
    </div>
{/each} -->
