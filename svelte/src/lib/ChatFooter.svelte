<script lang="ts">
    import { interpretStyle } from "../utils/style";
    import { classNames as cn, type ClassNamesObject } from "../utils/style";
    import Divider from "./Divider.svelte";
    import Flex from "./Flex.svelte";
    let inputFocus = $state(false);
    const chatInputWrapper: ClassNamesObject = $derived({
        "chat-input-wrapper": true,
        "synthetic-focus": inputFocus,
    });
</script>

<Flex>
    <Divider />
    <Flex gap={"var(--spacing-1)"}>
        <Flex row _class="btn">
            <p>{"src/App.tsx"}</p>
        </Flex>
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
    .btn {
        padding: var(--spacing-1);
        background-color: var(--vscode-input-foreground);
        outline: 1px solid var(--vscode-input-border);
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
