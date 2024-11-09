<script lang="ts">
    import { onMount } from "svelte";
    import { codeStore } from "../store/vscode";
    import OpenAI from "openai";
    onMount(() => {
        if (!$codeStore) {
            const code = (window as any)["acquireVsCodeApi"]();
            if (!code) {
                //TODO: handle error
                console.error("Failed to acquire code api");
                return;
            }
            codeStore.set(code);
        }
        window.addEventListener("message", (event) => {
            const chunck: OpenAI.Chat.Completions.ChatCompletionChunk =
                event.data;
            console.log("RECEIVED: ", event);
        });
    });
</script>
