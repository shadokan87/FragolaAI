<script lang="ts">
  export let variant: "body" | "code" | "heading" = "body"; // body, code, heading
  export let size: "small" | "normal" | "large" = "normal"; // small, normal, large
  export let children: any | undefined;
  export let _class = "";
  export {_class as class};
</script>

<span class={`typography ${variant} ${size} ${_class}`}>
  {@render children()}
</span>

<style>
  .typography {
    margin: 0;
    padding: 0;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .typography.body {
    font-family: var(--vscode-font-family);
    font-weight: var(--vscode-font-weight);
    color: var(--vscode-foreground);
  }

  .typography.code {
    font-family: var(--vscode-editor-font-family);
    font-weight: var(--vscode-editor-font-weight);
    color: var(--vscode-editor-foreground);
  }

  .typography.heading {
    font-family: var(--vscode-font-family);
    font-weight: bold;
    color: var(--vscode-foreground);
  }

  .typography.small {
    font-size: calc(var(--vscode-font-size) * 0.85);
  }

  .typography.normal {
    font-size: var(--vscode-font-size);
  }

  .typography.large {
    font-size: calc(var(--vscode-font-size) * 1.2);
  }

  .typography.code.small {
    font-size: calc(var(--vscode-editor-font-size) * 0.85);
  }

  .typography.code.normal {
    font-size: var(--vscode-editor-font-size);
  }

  .typography.code.large {
    font-size: calc(var(--vscode-editor-font-size) * 1.2);
  }
</style>
