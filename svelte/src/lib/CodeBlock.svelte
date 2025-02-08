<svelte:options
    customElement={{
        tag: "code-block",
        props: {
            lang: { reflect: true, type: "String" },
            path: { reflect: true, type: "String" },
            content: { reflect: true, type: "String" },
        },
    }}
/>

<script lang="ts">
    import {
        RiChatAiFill,
        RiFileAddFill,
        RiFileCopyFill,
    } from "svelte-remixicon";
    import Button from "./Button.svelte";
    import Flex from "./Flex.svelte";
    import Typography from "./Typography.svelte";

    interface props {
        lang?: string;
        content?: string;
        highlightId?: string;
    }

    let { lang, content }: props = $props();
    let html = $state(content);
</script>

<Flex _class={"code-block-container"}>
    <Flex row justifyBetween _class="code-block-header">
        <Typography>{lang || ""}</Typography>
        <Flex row gap={"sp-2"}>
            <Button
                variant={"ghost"}
                kind="flex"
                icon={RiChatAiFill}
                iconProps={{ size: 18 }}
            />
            <Button
                variant={"ghost"}
                kind="flex"
                icon={RiFileCopyFill}
                iconProps={{ size: 18 }}
            />
            <Button
                variant={"ghost"}
                kind="flex"
                icon={RiFileAddFill}
                iconProps={{ size: 18 }}
            />
        </Flex>
    </Flex>
    <div class={"code-block-code-content"}>
        {@html html}
        <!-- {#await html}
            Loading...
        {:then content}
            {@html content}
        {:catch error}
            Error: {error.message}
        {/await} -->
    </div>
</Flex>

<style lang="scss">
    :global(.code-block-container) {
        background-color: var(--vscode-editor-background);
        border: 1px solid var(--vscode-widget-border);
        border-radius: 4px;
    }

    :global(.code-block-header) {
        padding: 8px;
        background-color: var(--vscode-editorWidget-background);
        border-bottom: 1px solid var(--vscode-widget-border);
        color: var(--vscode-editorWidget-foreground);
    }

    :global(.code-block-code-content) {
        padding: 16px;
        font-family: var(--vscode-editor-font-family);
        font-size: var(--vscode-editor-font-size);
        color: var(--vscode-editor-foreground);
        white-space: pre-wrap;
        overflow-x: auto;
    }
</style>
