<script lang="ts">
    import { onMount } from "svelte";
    import { codeStore } from "../store/vscode";
    import OpenAI from "openai";
    import type { basePayload, inTypeUnion } from "../../../src/workers/types";
    import type { ChatWorkerPayload } from "../../../src/workers/chat/chat.worker";
    import { receiveStreamChunk } from "../../../common/utils";
    import { codeStore as codeApi, colorTheme } from "../store/vscode";
    import {
        extensionStateStore as extensionState,
    } from "../store/chat.svelte";
    import type { extensionState as extensionStateType, chunkType } from "../../../common";

    let chunks: chunkType[] = $state.raw([]);
    type inCommingPayload = basePayload<inTypeUnion>;
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
