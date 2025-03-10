<script lang="ts">
    import { type ChatWorkerPayload } from "../../../src/workers/chat/chat.worker";
    import { codeStore as codeApi } from "../store/vscode";
    import { extensionState } from "../store/chat.svelte";
    import {
        MentionKind,
        type PartialMention,
        type PartialPrompt,
        type Prompt,
    } from "../../../common";
    import ChatInput from "./ChatInput.svelte";
    import Flex from "./Flex.svelte";
    import MentionsSelector from "./MentionsSelector.svelte";
    import type {
        FormEventHandler,
        KeyboardEventHandler,
    } from "svelte/elements";

    let input: string = $state("");
    let prompt: PartialPrompt = $derived(parseInputValue(input));
    let promptSplitIndex: number = $state(0);
    let parsed: number = 0;
    let isInMention: boolean = $derived(
        typeof prompt[promptSplitIndex] != "string",
    );
    $effect(() => {
        console.log("Prompt: ", prompt);
    });
    const isAlphanumeric = (str: string, exception: string[] = ["/"]) =>
        /^[a-zA-Z0-9]+$/.test(str) || exception.includes(str);
    const invalidatingCharacters: string[] = [" "]; // (Space key included)

    function parseInputValue(_value: string): PartialPrompt {
        let result: PartialPrompt = [];
        let mentionIndex = -1;
        let i = 0;
        let value = _value;
        let mentionRef: PartialMention | null = null;
        let mentionContent: string = "";

        const parseMention = (reset = false) => {
            console.log(`Match: ${mentionContent}`);
            if (!mentionRef) {
                //TODO: handle error
                console.error("Expected mentionRef to be defined");
                return;
            }
            if (mentionContent.includes(":")) {
                const split = mentionContent.split(":");
                if (split[0] == "folder") mentionRef.kind = MentionKind.FOLDER;
                mentionRef.content = split[1];
            } else {
                mentionRef.kind = MentionKind.FILE;
                mentionRef.content = mentionContent;
            }
            if (mentionRef.kind) mentionRef.kindParsed = true;
            if (reset) {
                mentionIndex = -1;
                mentionRef = null;
                mentionContent = "";
            }
        };

        while (i < value.length) {
            if (value[i] == "@") {
                // First encounter of a mention
                if (i == 0) mentionIndex = i;
                else if (
                    !invalidatingCharacters.includes(value[i - 1]) ||
                    !isAlphanumeric(value[i - 1])
                )
                    mentionIndex = i;
                if (!mentionRef) {
                    mentionRef = { kindParsed: false };
                    result.push(mentionRef);
                }
                if (!mentionRef) {
                    //TODO: handle error
                    console.error("mentionRef assignation failed");
                    break;
                }
                i++;
                continue;
            }
            if (mentionIndex != -1) {
                if (value[i] == " " || !isAlphanumeric(value[i])) {
                    console.log(`parseMention([${value[i]}])`);
                    parseMention(true);
                } else {
                    mentionContent += value[i];
                    parseMention();
                }
            } else {
                if (!result.length || typeof result.at(-1) != "string")
                    result.push("");
                result[result.length - 1] =
                    result[result.length - 1] + value[i];
            }
            i++;
        }
        return result;
    }

    const handleSubmitPrompt: KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!extensionState.isDefined) {
                //TODO: handle error
                console.error("Extension state undefined");
                return;
            }
            const payload: ChatWorkerPayload = {
                type: "chatRequest",
                data: {
                    prompt,
                    conversationId:
                        extensionState.value.workspace.ui.conversationId,
                },
            };
            $codeApi?.postMessage(payload);
            return ;
        }
        return;
    };
</script>

<Flex gap={"sp-1"}>
    <!-- {#if isInMention}
        <MentionsSelector />
    {/if} -->
    <ChatInput bind:prompt={input} onKeydown={handleSubmitPrompt} />
</Flex>

<style lang="scss">
    // .tag {
    //     padding: 0.1rem;
    //     background-color: var(--vscode-badge-background);
    //     border-radius: var(--spacing-1);
    //     cursor: pointer;
    // }
</style>
