<script lang="ts">
    import {
        RiAddFill,
        RiFileImageFill,
        RiSendPlane2Fill,
        RiSendPlaneFill,
    } from "svelte-remixicon";
    import { type ClassNamesObject, classNames as cn } from "../utils/style";
    import Button from "./Button.svelte";
    import Flex from "./Flex.svelte";
    import Typography from "./Typography.svelte";

    interface props {
        onKeydown: (e: KeyboardEvent) => void;
        prompt: string;
    }
    let inputFocus = $state(false);
    let { onKeydown, prompt = $bindable() }: props = $props();
    const chatInputWrapper: ClassNamesObject = $derived({
        "chat-input-wrapper": true,
        "synthetic-focus": inputFocus,
    });
</script>

<div class={cn(chatInputWrapper)}>
    <Flex gap={"sp-2"}>
        <div class="focused-files">
            <Flex row gap="sp-2">
                <Button kind="flex" icon={RiAddFill} />
                {#each Array.from({ length: 5 }, (_, i) => `Attach image ${i + 1}`) as text}
                    <Button kind="flex" icon={RiFileImageFill} {text} />
                {/each}
            </Flex>
        </div>
        <input
            bind:value={prompt}
            onfocus={() => (inputFocus = true)}
            onblur={() => (inputFocus = false)}
            onkeydown={onKeydown}
            placeholder={"Ask Fragola, press '@' to focus a file"}
        />
        <Flex row justifyBetween>
            <Flex row gap="sp-2">
                <Button kind="flex" icon={RiFileImageFill} />
            </Flex>
            <Flex _class="bottom-bar" row gap="sp-2">
                <Button kind="custom">
                    <Flex gap="sp-2" row>
                        <Typography
                            >{"Submit"}<span class="keyboard-key">
                                {"↵"}
                            </span></Typography
                        >
                        <RiSendPlane2Fill />
                    </Flex>
                </Button>
                <Typography
                    >{"Alt + "}<span class="keyboard-key">
                        {"↵"}
                    </span>{": ignore focused files"}</Typography
                >
            </Flex>
        </Flex>
    </Flex>
</div>

<style lang="scss">
    input {
        all: unset;
        width: -webkit-fill-available;
        background-color: none;
        color: var(--vscode-input-foreground);
        padding-bottom: 1em;
    }
    .chat-input-wrapper {
        width: inherit;
        outline: var(--outline-size) solid var(--vscode-input-border);
        background-color: var(--vscode-input-background);
        padding: var(--spacing-3);
        height: fit-content;
        margin: 1em;
        border-radius: 0.75rem;
    }
    .synthetic-focus {
        outline: var(--outline-size) solid var(--vscode-focusBorder) !important;
    }
</style>
