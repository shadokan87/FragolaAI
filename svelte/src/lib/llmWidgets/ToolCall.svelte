<script lang="ts">
    import { z } from "zod";
    import {
        codeGenSchema,
        codeGenToolInfo,
    } from "../../../../src/Fragola/agentic/tools/code/codeSnippet";
    // import {
    //     readFileByIdSchema,
    //     readFileByIdToolInfo,
    // } from "../../../../src/Fragola/agentic/tools/navigation/readFileById";
    import Flex from "../Flex.svelte";
    import {
        RiFileAddLine,
        RiFileEditLine,
        RiLoader4Fill,
        RiSearchLine,
        RiTerminalBoxLine,
    } from "svelte-remixicon";
    import Typography from "../Typography.svelte";
    import { extensionState } from "../../store/chat.svelte";
    import type { ToolCallType } from "../../../../common";
    import { isToolAnswered } from "../../../../common";

    interface props {
        index: number;
    }
    const { index } = $props();
    $effect(() => {
        console.log(
            "test tool call: ",
            (extensionState.value.workspace.messages[index] as any)[
                "tool_calls"
            ],
        );
    });
    function parseArguments<T>(schema: z.Schema<T>, json: Record<string, any>) {
        const parsed = schema.safeParse(json);
        if (parsed.error) return undefined;
        return parsed.data;
    }
    interface custom {
        id: string;
        fullPath: string;
    }

    interface TreeResult<T = custom> {
        name: string;
        path: string;
        type: "file" | "folder";
        custom: T;
        children?: TreeResult[];
    }
    function findPathFromId(id: string) {
        const tree = extensionState.value.workspace.tree;

        function search(node: TreeResult): string | undefined {
            // Check current node
            if (node.custom?.id === id) {
                return node.path;
            }

            // Check children if they exist
            if (node.children && Array.isArray(node.children)) {
                for (let i = 0; i < node.children.length; i++) {
                    const child = node.children[i];
                    const result = search(child);
                    if (result) {
                        return result;
                    }
                }
            }

            return undefined;
        }

        // Handle the case where tree might be undefined
        if (!tree) {
            return id;
        }

        const result = search(tree);
        return result || id; // Return the original id if path not found
    }
    const readFileByIdToolInfo = {
        name: "readFileById",
        description:
            "Use this tool to get the content of a file in the project",
    };

    const readFileByIdSchema = z.object({
        id: z
            .string()
            .describe(
                "The id of the file to inspect. returns the content of the file",
            ),
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
            <Typography
                >{((): string => {
                    if (!parameters.path) return "";
                    if (parameters.actionType == "UPDATE")
                        return (
                            findPathFromId(parameters.path) || parameters.path
                        );
                    return parameters.path;
                })()}</Typography
            >
        </Flex>
        {#if loading}
            <span class="spinner">
                <RiLoader4Fill size={"16"} />
            </span>
        {/if}
    </Flex>
{/snippet}

{#snippet shellAction()}
    <Flex row gap={"sp-2"} _class="widget-base"></Flex>
{/snippet}

{#snippet codeGenRouter(
    parameters: z.infer<typeof codeGenSchema> | undefined,
    tool: ToolCallType,
)}
    {#if parameters && ["CREATE", "UPDATE"].includes(parameters.actionType)}
        {@render fileAction(
            parameters,
            !isToolAnswered(tool, extensionState.value.workspace.messages),
        )}
    {:else if parameters?.actionType == "SHELL"}
        <Flex row justifyBetween _class="widget-base">
            <Flex row gap={"sp-2"}>
                <RiTerminalBoxLine />
                <Typography>{`Command: ${parameters.sourceCode}`}</Typography>
            </Flex>
        </Flex>
    {/if}
{/snippet}

{#if extensionState.value.workspace.messages[index].role == "assistant"}
    <Flex gap={"sp-2"}>
        {#each extensionState.value.workspace.messages[index].tool_calls || [] as tool}
            {#if tool.function.name == codeGenToolInfo.name}
                {@render codeGenRouter(
                    parseArguments(
                        codeGenSchema,
                        JSON.parse(tool.function.arguments),
                    ),
                    tool,
                )}
            {:else if tool.function.name == readFileByIdToolInfo.name}
                <Flex row justifyBetween _class="widget-base">
                    <Flex row gap={"sp-2"}>
                        <RiSearchLine />
                        <Typography
                            >{(() => {
                                const parsed = parseArguments(
                                    readFileByIdSchema,
                                    JSON.parse(tool.function.name),
                                );
                                if (!parsed) return "File path unknown";
                                return findPathFromId(parsed.id);
                            })()}</Typography
                        >
                    </Flex>
                </Flex>
            {/if}
        {/each}
    </Flex>
{/if}

<style lang="scss">
    :global(.widget-base) {
        border: var(--outline-size) solid var(--vscode-input-border);
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
