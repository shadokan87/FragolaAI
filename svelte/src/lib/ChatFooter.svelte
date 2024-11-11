<script lang="ts">
    import { interpretStyle } from "../utils/style";
    import { classNames as cn, type ClassNamesObject } from "../utils/style";
    import Divider from "./Divider.svelte";
    import Flex from "./Flex.svelte";
    import {RiFileImageFill} from "svelte-remixicon";

    let inputFocus = $state(false);
    const chatInputWrapper: ClassNamesObject = $derived({
        "chat-input-wrapper": true,
        "synthetic-focus": inputFocus,
    });
</script>

<Flex _class={"chat-footer-wrapper"}>
    <Divider />
    <Flex gap={"sp-2"}>
        <button class={"btn"}>
            <!-- <Flex row> -->
            <RiFileImageFill class="base-icon"/>
            {"src/App.tsx"}
            <!-- </Flex> -->
        </button>
        <div class={cn(chatInputWrapper)}>
            <input
                class="base-input"
                style:width="100%"
                onfocus={() => (inputFocus = true)}
                onblur={() => (inputFocus = false)}
            />
        </div>
    </Flex>
</Flex>

<style lang="scss">
    :global(.chat-footer-wrapper) {
        margin-bottom: 1em;
    }
    :global(.base-icon) {
        fill: white; /* Change the SVG icon color to white */
    }
    :global(.btn) {
        padding: var(--spacing-1);
        background-color: var(--vscode-input-background);
        outline: 1px solid var(--vscode-input-border);
        border: none; /* Disable button bevel */
        cursor: pointer;
        width: fit-content; /* Make width fit content */
        height: 1.2rem;
        border-radius: var(--spacing-1);
        color: var(--vscode-foreground)
    }
    .chat-input-wrapper {
        padding: var(--spacing-2);
        background-color: var(--vscode-input-background);
        border-radius: var(--spacing-1);
        outline: 1px solid var(--vscode-input-border);
    }
    .chat-input {
        padding: 1rem; // Added for spacing
    }
    .synthetic-focus {
        outline: 1px solid var(--vscode-focusBorder) !important;
    }
    .base-input {
        all: unset;
        background-color: inherit;
        color: var(--vscode-input-foreground);
    }
</style>
