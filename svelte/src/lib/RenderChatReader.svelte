<script lang="ts">
    import type { Marked, Token, TokensList } from "marked";
    import {
        chatStreaming,
        extensionStateStore,
        type chatReader,
        type noRenderer,
        type renderer,
    } from "../store/chat.svelte";
    import Divider from "./Divider.svelte";
    import { type Subscription } from "rxjs";
    import type { messageType } from "../../../common";

    export interface props {
        reader: chatReader | undefined;
    }
    const { reader = $bindable() }: props = $props();

    let messages = $state<Partial<messageType>[]>([]);
    let renderers = $state<(renderer | noRenderer)[]>([]);
    let messageSubscription: Subscription | undefined;
    let rendererSubscription: Subscription | undefined;

    $effect(() => {
        if (reader) {
            messageSubscription?.unsubscribe();
            rendererSubscription?.unsubscribe();

            messageSubscription = reader.loaded$.subscribe((value) => {
                messages = value;
            });

            rendererSubscription = reader.renderer$.subscribe((value) => {
                renderers = value;
            });
        }
        return () => {
            messageSubscription?.unsubscribe();
            rendererSubscription?.unsubscribe();
        };
    });
</script>

<p>{"loaded length: " + messages.length}</p>
{#if reader && renderers.length}
    {#each renderers as renderer, i}
        {#if typeof renderer !== "string"}
            <div>
                {@html renderer.html}
            </div>
        {:else}
            <p>{messages[i].content}</p>
        {/if}
        {#if i < renderers.length - 1}
            <Divider />
        {/if}
    {/each}
{/if}
