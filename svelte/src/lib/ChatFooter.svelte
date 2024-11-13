<script lang="ts">
    import { classNames as cn, type ClassNamesObject } from "../utils/style";
    import Divider from "./Divider.svelte";
    import Flex from "./Flex.svelte";
    import { RiFileImageFill } from "svelte-remixicon";
    import Typography from "./Typography.svelte";
    import Button from "./Button.svelte";
    import { LucideBot, type IconProps } from "lucide-svelte";

    let inputFocus = $state(false);
    const chatInputWrapper: ClassNamesObject = $derived({
        "chat-input-wrapper": true,
        "synthetic-focus": inputFocus,
    });
    const lucidBotProps: IconProps = {
        size: 16
    }
</script>

<Flex _class={"chat-footer-wrapper"}>
    <!-- Vertical flex with input and util bars -->
    <Flex gap={"sp-2"}>
        <Divider margin={"0"}/>
        <Flex justifyBetween row _class={"aux-bar"}>
            <Flex row gap={"sp-2"}>
                <Typography>{"Focused files"}</Typography>
                <Button
                    kind="flex"
                    icon={RiFileImageFill}
                    text={"Attach image"}
                />
            </Flex>
            <!-- Shortcut tips on the right -->
            <Typography
                ><span class="keyboard-key">
                    {"@"}
                </span>{": Focus a file"}</Typography
            >
        </Flex>
        <Divider margin={"0"}/>
        <!-- Horizontal flex util bar with buttons like
         'attach image', model picker etc on the left and shortcut tips on the right -->
        <Flex justifyBetween row _class={"aux-bar"}>
            <!-- Buttons on the left -->
            <Flex row gap={"sp-2"}>
                <Button
                    variant={"fill"}
                    kind="flex"
                    icon={RiFileImageFill}
                    text={"Attach image"}
                />
                <Button
                    variant={"outline"}
                    kind="flex"
                    icon={LucideBot}
                    iconProps={lucidBotProps}
                    text={"Using gpt4-o"}
                    dropdown={[{ text: "gpt4-o" }, { text: "claude 3.5" }]}
                />
            </Flex>
            <!-- Shortcut tips on the right -->
            <Typography
                >{"Alt + "}<span class="keyboard-key">
                    {"↵"}
                </span>{": ignore focused files"}</Typography
            >
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
    :global(.aux-bar) {
        width: 100%;
    }
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
