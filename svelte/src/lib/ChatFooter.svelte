<script lang="ts">
    import { type ChatWorkerPayload } from "../../../src/workers/chat/chat.worker";
    import { codeStore as codeApi } from "../store/vscode";
    import { extensionState } from "../store/chat.svelte";
    import type { Prompt } from "../../../common";
    import ChatInput from "./ChatInput.svelte";

    let inputFocus = $state(false);
    // let prompt = $state("How to use splice javascript ?");
    let prompt = $state("This is a test, answer with a random sentence");
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
