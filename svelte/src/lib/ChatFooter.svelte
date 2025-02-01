<script lang="ts">
    import { classNames as cn, type ClassNamesObject } from "../utils/style";
    import Divider from "./Divider.svelte";
    import Flex from "./Flex.svelte";
    import { RiFileImageFill } from "svelte-remixicon";
    import Typography from "./Typography.svelte";
    import Button from "./Button.svelte";
    import { LucideBot, type IconProps } from "lucide-svelte";
    import { type ChatWorkerPayload } from "../../../src/workers/chat/chat.worker";
    import { codeStore as codeApi } from "../store/vscode";
    import { v4 } from "uuid";
    import { extensionState } from "../store/chat.svelte";
    import type { MessageType, Prompt } from "../../../common";
    import ChatInput from "./ChatInput.svelte";
    import { NONE_SENTINEL } from "../../../common/types";

    let inputFocus = $state(false);
    // let prompt = $state("How to use splice javascript ?");
    let prompt = $state("This is a test, answer with a random sentence");

    const chatInputWrapper: ClassNamesObject = $derived({
        "chat-input-wrapper": true,
        "synthetic-focus": inputFocus,
    });
    const lucidBotProps: IconProps = {
        size: 16,
    };
    function handleSubmitPrompt(e: KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            const input = e.target as HTMLInputElement;
            if (!extensionState.isDefined) {
                console.error("Extension state undefined");
                return;
            }
            const prompt: Prompt = [input.value];
            const payload: ChatWorkerPayload = {
                type: "chatRequest",
                data: {
                    prompt,
                    conversationId: extensionState.value.workspace.ui.conversationId
                },
            };
            $codeApi?.postMessage(payload);
        }
    }
</script>

<ChatInput {prompt} onKeydown={handleSubmitPrompt} />

<style lang="scss">
</style>
