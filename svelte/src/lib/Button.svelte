<script lang="ts" generics="T">
    import Flex from "./Flex.svelte";
    import Typography from "./Typography.svelte";
    import type { SvelteComponent } from "svelte";
    import { classNames as cn, parseClass } from "../utils/style";

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
    // let _class = defaultClass;
    interface props<T = {}> {
        kind: "flex" | "custom";
        icon?: typeof SvelteComponent<any>;
        iconProps?: T;
        text?: string;
        dropdown?: dropdownOption[];
        variant?: "ghost" | "outline" | "none";
        children?: any;
        class?: string;
        onclick?: (e?: MouseEvent) => void;
    }

    let {
        kind,
        variant = "ghost",
        iconProps = {},
        children,
        class: _class,
        onclick,
        ...rest
    }: props = $props();
    let ready = $state(false);
    const defaultClass = "btn";
    $effect(() => {
        console.log("__CLASS__", _class);
        if (!_class) _class = defaultClass;
        else _class = parseClass(defaultClass, _class);
        ready = true;
    });
</script>

{#snippet buttonFlexContent()}
    <Flex row gap={"var(--spacing-1)"} _class="button-content">
        <rest.icon {...iconProps} />
        {#if rest.text}
            <Typography class="adjusted-line-height">
                {rest.text}
            </Typography>
        {/if}
    </Flex>
{/snippet}

{#if ready}
    {#if rest.dropdown == undefined}
        <button class={`${_class} ${variant}`} {onclick}>
            {#if children}
                {@render children()}
            {:else if kind == "flex"}
                {@render buttonFlexContent()}
            {/if}
        </button>
    {:else}
        <div class="dropdown-container">
            <button
                use:melt={$trigger}
                class={`${_class} ${variant}`}
                {onclick}
            >
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
{/if}

<style lang="scss">
    :global(.adjusted-line-height) {
        line-height: 1;
    }
    .btn {
        padding: var(--spacing-1);
        background-color: var(--vscode-input-background);
        &.ghost {
            background-color: transparent !important;
            &:hover {
                background-color: var(--vscode-input-background) !important;
            }
        }
        &.outline {
            outline: var(--outline-size) solid var(--vscode-widget-border);
        }
        border: none;
        cursor: pointer;
        width: fit-content;
        height: 1.4rem;
        border-radius: var(--spacing-1);
        color: var(--vscode-foreground);
        white-space: nowrap;
        display: flex;
        align-items: center;
        transition-duration: 150ms;
    }
    :global(.button-content) {
        display: flex;
        align-items: center;
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
