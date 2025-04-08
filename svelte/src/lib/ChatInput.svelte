<script lang="ts">
    import {
        RiAddFill,
        RiArrowUpFill,
        RiCornerDownLeftFill,
        RiFileImageFill,
        RiFileWarningFill,
        RiImageAiLine,
        RiRobot2Line,
        RiSendPlane2Fill,
        RiSendPlaneFill,
    } from "svelte-remixicon";
    import { type ClassNamesObject, classNames as cn } from "../utils/style";
    import Button from "./Button.svelte";
    import Flex from "./Flex.svelte";
    import Typography from "./Typography.svelte";
    import { extensionState } from "../store/chat.svelte";
    import ToolTip from "./ToolTip.svelte";
    import { defaultToolTipProps } from "../utils/constants";
    import type { KeyboardEventHandler } from "svelte/elements";
    import { InteractionMode, type ExtensionState, type payloadTypes } from "../../../common";
    import { codeStore as codeApi } from "../store/vscode";

    interface props {
        onKeydown: KeyboardEventHandler<HTMLInputElement>
        prompt: string;
    }
    let inputFocus = $state(false);
    let { onKeydown, prompt = $bindable() }: props = $props();
    const chatInputWrapper: ClassNamesObject = $derived({
        "chat-input-wrapper": true,
        "synthetic-focus": inputFocus,
    });
    function handleChangeInteractionMode(mode: InteractionMode) {
        const payload: payloadTypes.ui.changeInteractionMode = {
            type: "changeInteractionMode",
            parameters: {
                mode
            }
        }
        $codeApi?.postMessage(payload);
    }
</script>

<div class={cn(chatInputWrapper)}>
    <Flex gap={"sp-2"}>
        <input
            bind:value={prompt}
            onfocus={() => (inputFocus = true)}
            onblur={() => (inputFocus = false)}
            onkeydown={onKeydown}
            placeholder={"Ask Fragola, press '@' to focus a file"}
        />
        <Flex row justifyBetween>
            <Flex row gap={"sp-2"}>
                <ToolTip text={"Attach an image"}>
                    <Button
                        kind="flex"
                        variant="ghost"
                        icon={RiImageAiLine}
                        iconProps={{ size: "16" }}
                    />
                </ToolTip>
                <ToolTip text={"Select LLM model"}>
                <Button
                    variant={"outline"}
                    kind="flex"
                    icon={RiRobot2Line}
                    iconProps={ {size: "16"} }
                    text={"Using gpt4-o"}
                    dropdown={[{ text: "gpt4-o" }, { text: "claude 3.5" }]}
                />
                </ToolTip>
                {#each [InteractionMode.CHAT, InteractionMode.BUILD, InteractionMode.PLAN] as interactionMode}
                    <Button kind={"flex"} variant={"outline"} text={interactionMode == extensionState.value.workspace.ui.interactionMode ? `-> ${interactionMode}` : interactionMode} onclick={() => handleChangeInteractionMode(interactionMode)}/>
                {/each}
            </Flex>
            <Flex row gap={"sp-2"}>
                <ToolTip text={"Send prompt"}>
                    <Button
                        kind="flex"
                        variant="outline"
                        icon={RiArrowUpFill}
                        iconProps={{ size: "16" }}
                    />
                </ToolTip>
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
    }
    .chat-input-wrapper {
        // width: inherit;
        outline: var(--outline-size) solid var(--vscode-input-border);
        background-color: var(--vscode-input-background);
        padding: var(--spacing-3);
        height: fit-content;
        border-radius: 0.25rem;
    }
    .synthetic-focus {
        outline: var(--outline-size) solid var(--vscode-focusBorder) !important;
    }
</style>
