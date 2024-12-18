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
    import { chatStreaming, createChatReader, staticMessageHandler, TMP_READER_SENTINEL } from "../store/chat.svelte";
    import { extensionStateStore as extensionState } from "../store/chat.svelte";
    import type { messageType } from "../../../common";
    import ChatInput from "./ChatInput.svelte";

    let inputFocus = $state(false);
    let prompt = $state("How to use splice javascript ?");

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
            const payload: ChatWorkerPayload = {
                type: "chatRequest",
                // id: v4(),
                data: {
                    prompt: input.value,
                    loadedLength: (() => {
                        if (!$extensionState?.chat.id)
                            return 0;
                        const reader = chatStreaming.readers.get($extensionState.chat.id);
                        return (reader && reader?.loaded.length) || 0;
                    })()
                },
            };
            $codeApi?.postMessage(payload);
            const userMessage: messageType = {role: "user", content: payload.data.prompt};
            if ($extensionState?.chat.id) {
                const reader = chatStreaming.readers.get($extensionState.chat.id);
                if (!reader)
                    throw new Error("Chat id exist but reader undefined");
                reader.length = reader.length + 1;
                reader.loaded = [...reader.loaded, userMessage];
                reader.renderer = [...reader.renderer, "user"];
            } else {
                chatStreaming.readers.set(TMP_READER_SENTINEL, createChatReader({loaded: [userMessage], length: 1, renderer: ["user"]}));
            }
            console.log("!submit", input.value);
        }
    }
</script>

<ChatInput prompt={prompt} onKeydown={handleSubmitPrompt} />

<style lang="scss">
    // :global(.aux-bar) {
    //     width: 100%;
    // }
    // :global(.chat-footer-wrapper) {
    //     margin-bottom: 1em;
    // }
    // .chat-input-wrapper {
    //     padding: var(--spacing-2);
    //     background-color: var(--vscode-input-background);
    //     border-radius: var(--spacing-1);
    //     outline: var(--outline-size) solid var(--vscode-input-border);
    // }
    // .chat-input {
    //     padding: 1rem; // Added for spacing
    // }
    // .synthetic-focus {
    //     outline: var(--outline-size) solid var(--vscode-focusBorder) !important;
    // }
    // .base-input {
    //     all: unset;
    //     background-color: inherit;
    //     color: var(--vscode-input-foreground);
    // }
    // .focused-files-grid {
    //     display: grid;
    //     grid-template-columns: 1fr 8fr 1fr;
    // }
    // .focused-files-container {
    //     // overflow-y: hidden;
    //     overflow-x: auto;
    //     padding: var(--spacing-1);
    //     scrollbar-width: thin; // For Firefox
    //     scrollbar-color: var(--vscode-scrollbarSlider-background) transparent;
    // }
</style>
