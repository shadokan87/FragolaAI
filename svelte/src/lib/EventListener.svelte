<script lang="ts">
    import { onMount } from "svelte";
    import { codeStore } from "../store/vscode";
    import OpenAI from "openai";
    import type { basePayload, inTypeUnion } from "../../../src/workers/types";
    import type { ChatWorkerPayload } from "../../../src/workers/chat/chat.worker";
    import { receiveStreamChunk } from "../../../common/utils";
    import { codeStore as codeApi, colorTheme } from "../store/vscode";
    import {
        codeBlockHighlight,
        extensionStateStore as extensionState,
        staticMessageHandler,
        TMP_READER_SENTINEL,
        type chatReader,
    } from "../store/chat.svelte";
    import type { appendMessage, extensionState as extensionStateType } from "../../../common";
    import { chatStreaming } from "../store/chat.svelte";
    // import {specific} from "../store/chat.svelte";

    type chunckType = OpenAI.Chat.Completions.ChatCompletionChunk;
    let chuncks: chunckType[] = $state.raw([]);
    type inCommingPayload = basePayload<inTypeUnion>;
    // const streaming = createStreaming();
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
        window.addEventListener(
            "message",
            (event: { data: inCommingPayload }) => {
                switch (event.data.type) {
                    case "stateUpdate": {
                        const payload = event.data as inCommingPayload & {
                            data: extensionStateType;
                        };
                        console.log("__STATE__", payload);
                        extensionState.update(() => payload.data);
                        break;
                    }
                    case "__END__": {
                        chatStreaming.stopStream();
                        break;
                    }
                    case "chunck": {
                        const payload = event.data as inCommingPayload & {
                            data: chunckType;
                        };
                        console.log("__CHUNK__", payload);
                        if (!payload.id) {
                            console.error("Id is undefined");
                            return ;
                        }
                        if (!chatStreaming.isStreaming())
                            chatStreaming.stream(payload.id)
                        chatStreaming.receiveChunk(payload.id, payload.data);
                        break;
                    }
                    case "shikiHtml": {
                        const payload = event.data as inCommingPayload & {
                            data: string;
                        };
                        if (payload.id)
                            codeBlockHighlight().set(payload.id, payload.data);
                        break;
                    }
                    case "colorTheme": {
                        const payload = event.data as inCommingPayload & {
                            data: string;
                        };
                        console.log("++RECEIVED THEME: ", event);
                        colorTheme.set(payload.data);
                        break;
                    }
                    default: {
                        break;
                    }
                }
            },
        );
    });
</script>
