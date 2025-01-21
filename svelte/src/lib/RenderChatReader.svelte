<script lang="ts">
    import type { Marked, Token, TokensList } from "marked";
    import {
    extensionState,
        type renderedByComponent,
        type RendererLike,
    } from "../store/chat.svelte";
    import Divider from "./Divider.svelte";

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
{/if}
