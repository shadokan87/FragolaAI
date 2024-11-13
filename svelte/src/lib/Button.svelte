<script lang="ts">
    import { RiFileImageFill } from "svelte-remixicon";
    import Flex from "./Flex.svelte";
    import Typography from "./Typography.svelte";
    import type { SvelteComponent } from "svelte";
    interface props {
        kind: "flex"
        icon: typeof SvelteComponent<any>,
        text: string
    }
    let {kind, ...rest}: props =  $props();
</script>

<button class={"btn"}>
    {#if kind == "flex"}
        <Flex row gap={"var(--spacing-1)"}>
            <rest.icon class="base-icon" />
            <Typography class="adjusted-line-height">
                {rest.text}
            </Typography>
        </Flex>
    {/if}
</button>

<style lang="scss">
    :global(.adjusted-line-height) {
        line-height: 1;
    }
    .btn {
        padding: var(--spacing-1);
        background-color: var(--vscode-input-background);
        outline: var(--outline-size) solid var(--vscode-input-border);
        border: none; /* Disable button bevel */
        cursor: pointer;
        width: fit-content; /* Make width fit content */
        height: 1.2rem;
        border-radius: var(--spacing-1);
        color: var(--vscode-foreground);
        // text-align: center;
        // line-height: 1.2rem; /* Center text vertically */
    }
    :global(.base-icon) {
        fill: white; /* Change the SVG icon color to white */
    }
</style>
