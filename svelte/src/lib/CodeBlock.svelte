<script lang="ts">
    import { RiFileImageFill } from "svelte-remixicon";
    import Button from "./Button.svelte";
    import Flex from "./Flex.svelte";
    import Typography from "./Typography.svelte";

    interface props {
        lang?: string;
        path?: string;
        content?: string;
    }
    let { lang, path, content }: props = $props();
</script>

<Flex _class={"code-block-container"}>
    <Flex row justifyBetween _class="code-block-header">
        <Typography>{lang || ""}</Typography>
        <Flex row>
            <Button
                variant={"fill"}
                kind="flex"
                icon={RiFileImageFill}
                text={"Attach image"}
            />
            <Button
                variant={"fill"}
                kind="flex"
                icon={RiFileImageFill}
                text={"Attach image"}
            />
            <Button
                variant={"fill"}
                kind="flex"
                icon={RiFileImageFill}
                text={"Attach image"}
            />
        </Flex>
    </Flex>
    <div class={"code-block-code-content"}>
        {content}
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