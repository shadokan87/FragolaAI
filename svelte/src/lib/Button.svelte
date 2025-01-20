<script lang="ts" generics="T">
    import { RiFileImageFill } from "svelte-remixicon";
    import Flex from "./Flex.svelte";
    import Typography from "./Typography.svelte";
    import type { SvelteComponent } from "svelte";
    import { classNames as cn } from "../utils/style";

    import { createDropdownMenu, melt } from "@melt-ui/svelte";
    const {
        elements: { menu, item, trigger, arrow },
        states: { open },
    } = createDropdownMenu({
        positioning: {
            placement: "top",
        },
        closeOnOutsideClick: true,
    });

    type dropdownOption = {
        text: string;
    };

    interface props<T = {}> {
        kind: "flex" | "custom";
        icon?: typeof SvelteComponent<any>;
        iconProps?: T;
        text?: string;
        dropdown?: dropdownOption[];
        variant?: "fill" | "outline";
        children?: any;
        onclick?: () => void;
    }
    let {
        kind,
        variant = "fill",
        iconProps = {},
        children,
        onclick,
        ...rest
    }: props = $props();

    const iconClass = $derived(
        cn({
            "base-icon": true,
            fill: variant === "fill",
            outline: variant === "outline",
        }),
    );
</script>

{#snippet buttonFlexContent()}
    <Flex row gap={"var(--spacing-1)"} _class="button-content">
        <rest.icon class={iconClass} {...iconProps} />
        {#if rest.text}
            <Typography class="adjusted-line-height">
                {rest.text}
            </Typography>
        {/if}
    </Flex>
{/snippet}

{#if rest.dropdown == undefined}
    <button class={"btn"} onclick={onclick}>
        {#if children}
            {@render children()}
        {:else if kind == "flex"}
            {@render buttonFlexContent()}
        {/if}
    </button>
{:else}
    <div class="dropdown-container">
        <button use:melt={$trigger} class={"btn"} onclick={onclick}>
            {#if children}
                {@render children()}
            {:else if kind == "flex"}
                {@render buttonFlexContent()}
            {/if}
        </button>

        {#if $open}
            <div use:melt={$menu} class="dropdown-menu">
                {#each rest.dropdown as option}
                    <button use:melt={$item} class="dropdown-item">
                        <Typography>
                            {option.text}
                        </Typography>
                    </button>
                {/each}
            </div>
        {/if}
    </div>
{/if}

<style lang="scss">
    :global(.adjusted-line-height) {
        line-height: 1;
    }
    .btn {
        padding: var(--spacing-1);
        background-color: var(--vscode-input-background);
        outline: var(--outline-size) solid var(--vscode-input-border);
        border: none;
        cursor: pointer;
        width: fit-content;
        height: 1.4rem;
        border-radius: var(--spacing-1);
        color: var(--vscode-foreground);
        white-space: nowrap;
        display: flex;
        align-items: center;
    }
    :global(.button-content) {
        display: flex;
        align-items: center;
    }
    :global(.base-icon) {
        &.fill {
            fill: var(--vscode-foreground);
            stroke: none;
        }
        &.outline {
            fill: none;
            stroke: var(--vscode-foreground);
        }
    }
    .dropdown-container {
        position: relative;
    }
    .dropdown-menu {
        margin-bottom: var(--spacing-2);
        background-color: var(--vscode-input-background);
        border-radius: var(--spacing-1);
        padding: var(--spacing-1);
        outline: var(--outline-size) solid var(--vscode-input-border);
    }
    .dropdown-item {
        all: unset;
        padding: var(--spacing-1);
        cursor: pointer;
        width: 100%;
        border-radius: calc(var(--spacing-1) - 1px);
        display: block;
        box-sizing: border-box;
        &:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
    }
</style>
