<script lang="ts">
    import { onMount } from "svelte";
    import { codeStore } from "../store/vscode";
    import OpenAI from "openai";
    import type { basePayload, inTypeUnion } from "../../../src/workers/types";
    import type { ChatWorkerPayload } from "../../../src/workers/chat/chat.worker";
    import { receiveStreamChunk } from "../../../common/utils";
    import { codeStore as codeApi, colorTheme } from "../store/vscode";
    import {
        extensionState,
        LLMMessagesRendererCache,
        createChatMarkedRender,
        chatMarkedInstance,
        type renderer,
        type RendererLike,
        type renderedByComponent,
        MessagesRolesToRenderWithMarkDown,
    } from "../store/chat.svelte";
    import { NONE_SENTINEL, type ExtensionState } from "../../../common";

    type inCommingPayload = basePayload<inTypeUnion>;

    $effect(() => {
        if (
            !extensionState.isDefined ||
            extensionState.value.workspace.ui.conversationId == NONE_SENTINEL
        )
            return;
        const rendererRef: RendererLike[] | undefined =
            LLMMessagesRendererCache.value.get(
                extensionState.value.workspace.ui.conversationId,
            );
        if (!rendererRef) {
            //TODO: handle error
            console.error("Expected renderer to be defined");
            return;
        }
        const renderer = Array.from(rendererRef);
        const updateKind = ((): "STREAM" | "MESSAGE" | "NONE" => {
            switch (true) {
                case extensionState.value.workspace.messages.length !=
                    renderer.length:
                    return "MESSAGE";
                case extensionState.value.workspace.streamState == "STREAMING":
                    return "STREAM";
                default:
                    return "NONE";
            }
        })();
        console.log(`__UPDATE_KIND__`, updateKind);

        if (updateKind == "NONE") return;
        if (updateKind == "STREAM") {
            const lastMessage = extensionState.value.workspace.messages.at(-1);
            console.log("need to render: ", lastMessage);
            if (!lastMessage) {
                //TODO: handle error
                console.error("Expected last message to exist");
            } else if (!renderer.at(-1)) {
                //TODO: handle error
                console.error("Expected last renderer to exist");
            } else if (typeof renderer == "string") {
                //TODO: handle error
                console.error("Expected render by markdown");
            } else {
                let msg = { ...lastMessage };
                console.log("_MSG", msg);
                (renderer.at(-1) as renderer).render(msg);
            }
        }
        if (updateKind == "MESSAGE") {
            let i = renderer.length;

            while (i < extensionState.value.workspace.messages.length) {
                const message = extensionState.value.workspace.messages[i];
                if (MessagesRolesToRenderWithMarkDown.includes(message.role)) {
                    renderer[i] = createChatMarkedRender(chatMarkedInstance);
                    (renderer[i] as renderer).render(message);
                } else {
                    renderer[i] = message.role as renderedByComponent;
                }
                LLMMessagesRendererCache.update(
                    extensionState.value.workspace.ui.conversationId,
                    renderer,
                );
                i++;
            }
        }
    });

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
                            data: ExtensionState;
                        };
                        console.log("Svelte state: ", payload);
                        extensionState.set(payload.data);
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
