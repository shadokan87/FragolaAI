<script lang="ts">
    import type { Marked, Token, TokensList } from "marked";
    import { chatStreaming, extensionStateStore, type chatReader, type noRenderer, type renderer } from "../store/chat.svelte";
    import Divider from "./Divider.svelte";
    import { type Subscription } from "rxjs";
    import type { messageType } from "../../../common";

    export interface props {
        reader: chatReader | undefined;
    }
    const { reader = $bindable() }: props = $props();

    let messages = $state<Partial<messageType>[]>([]);
    let subscription: Subscription | undefined;

    $effect(() => {
        if (reader) {
            subscription?.unsubscribe();
            subscription = reader.loaded$.subscribe(value => {
                messages = value;
            });
        }
        return () => {
            subscription?.unsubscribe();
        }
    });
</script>

<p>{"loaded length: " + messages.length}</p>
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