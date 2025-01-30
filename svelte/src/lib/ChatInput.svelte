<script lang="ts">
    import {
        RiAddFill,
        RiCornerDownLeftFill,
        RiFileImageFill,
        RiFileWarningFill,
        RiSendPlane2Fill,
        RiSendPlaneFill,
    } from "svelte-remixicon";
    import { type ClassNamesObject, classNames as cn } from "../utils/style";
    import Button from "./Button.svelte";
    import Flex from "./Flex.svelte";
    import Typography from "./Typography.svelte";
    import { extensionState } from "../store/chat.svelte";
    import ToolTip from "./ToolTip.svelte";
    import {defaultToolTipProps} from "../utils/constants";

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
    <Flex row>
        <input
            bind:value={prompt}
            onfocus={() => (inputFocus = true)}
            onblur={() => (inputFocus = false)}
            onkeydown={onKeydown}
            placeholder={"Ask Fragola, press '@' to focus a file"}
        />
        <ToolTip text={"Send prompt"}>
            <Button kind="flex" icon={RiCornerDownLeftFill} iconProps={{size: "16"}} />
        </ToolTip>
    </Flex>
</div>

<style lang="scss">
    input {
        all: unset;
        width: -webkit-fill-available;
        background-color: none;
        color: var(--vscode-input-foreground);
    }
    .chat-input-wrapper {
        width: inherit;
        outline: var(--outline-size) solid var(--vscode-input-border);
        background-color: var(--vscode-input-background);
        padding: var(--spacing-3);
        height: fit-content;
        margin: 1em;
        border-radius: 0.25rem;
    }
    .synthetic-focus {
        outline: var(--outline-size) solid var(--vscode-focusBorder) !important;
    }
</style>
