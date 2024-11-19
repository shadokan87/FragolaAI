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
    //     const Prism = require('prismjs');
    // const loadLanguages = require('prismjs/components/');
    // loadLanguages(['haml']);

    // // The code snippet you want to highlight, as a string
    // const code = `= ['hi', 'there', 'reader!'].join " "`;

    // // Returns a highlighted HTML string
    // const html = Prism.highlight(code, Prism.languages.haml, 'haml');
    import {
        RiChatAiFill,
        RiFileAddFill,
        RiFileCopyFill,
    } from "svelte-remixicon";
    import Button from "./Button.svelte";
    import Flex from "./Flex.svelte";
    import Typography from "./Typography.svelte";
    import { colorTheme } from "../store/vscode";
    import { highlighterStore } from "../store/chat";
    // import { bundledLanguagesInfo } from "shiki";

    interface props {
        lang?: string;
        content?: string;
    }

    // const code = 'const a = 1' // input code
    // const html = await codeToHtml(code, {
    //   lang: 'javascript',
    //   theme: 'vitesse-dark'
    // })

    // console.log(html) // highlighted html string
    let { lang, content }: props = $props();
    // console.log("__THEME_INFO__", bundledThemesInfo);
    const toKebabCase = (str: string) => {
        return str
            .normalize("NFD") // Decompose characters with accents
            .replace(/[\u0300-\u036f]/g, "") // Remove accent marks
            .replace(/[^a-zA-Z0-9\s-]/g, "") // Remove special chars except spaces and hyphens
            .trim() // Remove leading/trailing spaces
            .toLowerCase() // Convert to lowercase
            .replace(/\s+/g, "-") // Replace spaces with hyphens
            .replace(/-+/g, "-"); // Replace multiple hyphens with single hyphen
    };

    let [link, _lang] = $derived.by(() => {
        if (lang?.includes(":")) {
            const split = lang.split(":");
            return [split[0], split[1]];
        }
        return [, lang];
    });

    const html = $derived.by(() => {
        if (!content) return "";
        if (!$colorTheme.length || !_lang) {
            console.log("No color theme");
            return content;
        }
        // const isLangSupported = Object.keys(bundledLanguages).includes(_lang);
        // if (!isLangSupported)
        //     return content;

        try {
            const themeColorAsKebabCase = toKebabCase($colorTheme);
            // const shikiInfo = bundledThemesInfo.find(
            //     (theme) => theme.id == themeColorAsKebabCase,
            // );
            
            if (true) {
                (async () => {
                    await $highlighterStore?.loadLanguage(_lang as any);
                    await $highlighterStore?.loadTheme(themeColorAsKebabCase as any);
                    return $highlighterStore?.codeToHtml(content, {
                        lang: _lang,
                        theme: themeColorAsKebabCase
                    })
                })();
            }
            
            return content;
        } catch (error) {
            console.error("Error highlighting code:", error);
            return content;
        }
    });
    html;
</script>

<Flex _class={"code-block-container"}>
    <Flex row justifyBetween _class="code-block-header">
        <Typography>{lang || ""}</Typography>
        <Flex row gap={"sp-2"}>
            <Button
                variant={"fill"}
                kind="flex"
                icon={RiChatAiFill}
                iconProps={{ size: 18 }}
            />
            <Button
                variant={"fill"}
                kind="flex"
                icon={RiFileCopyFill}
                iconProps={{ size: 18 }}
            />
            <Button
                variant={"fill"}
                kind="flex"
                icon={RiFileAddFill}
                iconProps={{ size: 18 }}
            />
        </Flex>
    </Flex>
    <div class={"code-block-code-content"}>
        {#await html}
            Loading...
        {:then content}
            {@html content}
        {:catch error}
            Error: {error.message}
        {/await}
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

        // Basic tokens
        :global(.token.comment) {
            color: var(--vscode-editorInfo-foreground, #3794ff);
            font-style: italic;
        }

        :global(.token.string) {
            color: var(--vscode-debugTokenExpression-string, #ce9178);
        }

        :global(.token.number) {
            color: var(--vscode-debugTokenExpression-number, #b5cea8);
        }

        :global(.token.boolean) {
            color: var(--vscode-debugTokenExpression-boolean, #4e94ce);
        }

        :global(.token.keyword) {
            color: var(--vscode-debugTokenExpression-name, #c586c0);
        }

        :global(.token.function) {
            color: var(--vscode-symbolIcon-functionForeground, #b180d7);
        }

        :global(.token.operator) {
            color: var(--vscode-symbolIcon-operatorForeground, #cccccc);
        }

        :global(.token.punctuation) {
            color: var(--vscode-editor-foreground, #cccccc);
        }

        :global(.token.class-name) {
            color: var(--vscode-symbolIcon-classForeground, #ee9d28);
        }

        :global(.token.constant) {
            color: var(--vscode-symbolIcon-constantForeground, #cccccc);
        }

        :global(.token.property) {
            color: var(--vscode-symbolIcon-propertyForeground, #cccccc);
        }

        :global(.token.variable) {
            color: var(--vscode-symbolIcon-variableForeground, #75beff);
        }

        :global(.token.namespace) {
            color: var(--vscode-symbolIcon-namespaceForeground, #cccccc);
        }

        :global(.token.method) {
            color: var(--vscode-symbolIcon-methodForeground, #b180d7);
        }

        :global(.token.interface) {
            color: var(--vscode-symbolIcon-interfaceForeground, #75beff);
        }

        :global(.token.type) {
            color: var(--vscode-debugTokenExpression-type, #4a90e2);
        }

        :global(.token.regex) {
            color: var(--vscode-terminal-ansiMagenta, #bc3fbc);
        }

        :global(.token.important) {
            color: var(--vscode-editorError-foreground, #f14c4c);
            font-weight: bold;
        }

        :global(.token.bold) {
            font-weight: bold;
        }

        :global(.token.italic) {
            font-style: italic;
        }

        :global(.token.entity) {
            cursor: help;
        }

        // Special handling for specific language constructs
        :global(.token.selector) {
            color: var(--vscode-symbolIcon-colorForeground, #cccccc);
        }

        :global(.token.tag) {
            color: var(--vscode-symbolIcon-snippetForeground, #cccccc);
        }

        :global(.token.attr-name) {
            color: var(--vscode-symbolIcon-propertyForeground, #cccccc);
        }

        :global(.token.attr-value) {
            color: var(--vscode-debugTokenExpression-string, #ce9178);
        }
    }
</style>
