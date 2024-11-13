<script lang="ts">
    import { classNames as cn, type ClassNamesObject } from "../utils/style";
    import Divider from "./Divider.svelte";
    import Flex from "./Flex.svelte";
    import { RiFileImageFill } from "svelte-remixicon";
    import Typography from "./Typography.svelte";
    import Button from "./Button.svelte";

    let inputFocus = $state(false);
    const chatInputWrapper: ClassNamesObject = $derived({
        "chat-input-wrapper": true,
        "synthetic-focus": inputFocus,
    });
</script>

<Flex _class={"chat-footer-wrapper"}>
    <Divider />
    <Flex gap={"sp-2"}>
        <Flex row gap={"sp-2"}>
            <Button kind="flex" icon={RiFileImageFill} text={"Attach image"} />
            <Button
                kind="flex"
                icon={RiFileImageFill}
                text={"Using gpt4-o"}
                dropdown={[{ text: "gpt4-o" }, { text: "claude 3.5" }]}
            />
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
    :global(.chat-footer-wrapper) {
        margin-bottom: 1em;
    }
    .chat-input-wrapper {
        padding: var(--spacing-2);
        background-color: var(--vscode-input-background);
        border-radius: var(--spacing-1);
        outline: var(--outline-size) solid var(--vscode-input-border);
    }
    .chat-input {
        padding: 1rem; // Added for spacing
    }
    .synthetic-focus {
        outline: var(--outline-size) solid var(--vscode-focusBorder) !important;
    }
    .base-input {
        all: unset;
        background-color: inherit;
        color: var(--vscode-input-foreground);
    }
</style>
