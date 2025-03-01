<script lang="ts">
    import { z } from "zod";
    import {
        codeGenSchema,
        codeGenToolInfo,
    } from "../../../../src/Fragola/agentic/tools/code/codeSnippet";
    import Flex from "../Flex.svelte";
    import {
        RiFileAddLine,
        RiFileEditLine,
        RiLoader4Fill,
    } from "svelte-remixicon";
    import Typography from "../Typography.svelte";
    import { extensionState } from "../../store/chat.svelte";
    import type { ToolCallType } from "../../../../common";
    import { isToolAnswered } from "../../../../common";

    interface props {
        index: number;
    }
    const { index } = $props();
    const message = $derived(extensionState.value.workspace.messages[index]);
    $effect(() => {
        console.log("Tool call: ", message);
    });
</script>

{#snippet fileAction(
    parameters: z.infer<typeof codeGenSchema>,
    loading: boolean,
)}
    <Flex row justifyBetween _class="widget-base">
        <Flex row gap={"sp-2"}>
            {#if parameters.actionType == "CREATE"}
                <RiFileAddLine />
            {:else}
                <RiFileEditLine />
            {/if}
            <Typography>{"src/test/path"}</Typography>
        </Flex>
        {#if loading}
            <span class="spinner">
                <RiLoader4Fill size={"16"}/>
            </span>
        {/if}
    </Flex>
{/snippet}

{#snippet shellAction()}
    <Flex row gap={"sp-2"} _class="widget-base"></Flex>
{/snippet}

{#snippet codeGenRouter(
    parameters: z.infer<typeof codeGenSchema>,
    tool: ToolCallType,
)}
    {#if ["CREATE", "UPDATE"].includes(parameters.actionType)}
        <!-- {@render fileAction(parameters, true)} -->
        {@render fileAction(parameters, !isToolAnswered(tool, extensionState.value.workspace.messages))}
    {/if}
{/snippet}

{#if message.role == "assistant" && message.tool_calls}
    {#each message.tool_calls as tool}
        {#if tool.function.name == codeGenToolInfo.name}
            {@render codeGenRouter(JSON.parse(tool.function.arguments), tool)}
        {/if}
    {/each}
{/if}

<style lang="scss">
    :global(.widget-base) {
        border: var(--outline-size) solid var(--vscode-widget-border);
        padding: var(--spacing-1);
        cursor: pointer;
        border-radius: var(--spacing-1);
    }
    .spinner {
        animation: rotate 1s linear infinite;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 16px;
        width: 16px;
    }

    @keyframes rotate {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
</style>
