<script lang="ts">
  import {
    createTooltip,
    melt,
    type CreateTooltipProps,
  } from "@melt-ui/svelte";
  import { fade } from "svelte/transition";
  import { defaultToolTipProps } from "../utils/constants";
  import { classNames as cn } from "../utils/style";

  interface props {
    children: any;
    text: string;
    custom?: CreateTooltipProps;
  }
  let { children, text, custom = defaultToolTipProps }: props = $props();
  const {
    elements: { trigger, content, arrow },
    states: { open },
  } = createTooltip(custom);
  const toolTipCn = cn({
    "tooltip-arrow": true,
    "bottom-outline": custom.positioning?.placement?.includes("bottom") || false,
    "top-outline": custom.positioning?.placement?.includes("top") || false,
  })
</script>

<div use:melt={$trigger}>
  {@render children()}
</div>

{#if $open}
  <div
    use:melt={$content}
    transition:fade={{ duration: 100 }}
    class="tooltip-content"
  >
      <div use:melt={$arrow} class={toolTipCn}></div>
    <p class="tooltip-text">{text}</p>
  </div>
{/if}

<style lang="scss">
  div {
    display: inline-block;
  }

  .top-outline {
    border-left: 1px solid var(--vscode-editorHoverWidget-border);
    border-top: 1px solid var(--vscode-editorHoverWidget-border);
  }

  .bottom-outline {
    border-right: 1px solid var(--vscode-editorHoverWidget-border);
    border-bottom: 1px solid var(--vscode-editorHoverWidget-border);
  }

  .tooltip-content {
    outline: 1px solid var(--vscode-editorHoverWidget-border);
  }
  
  .tooltip-content {
    border-radius: 0.5rem;
    background-color: var(--vscode-editor-background);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    z-index: 3;
  }

  .tooltip-text {
    padding: 0.25rem 0.75rem;
    margin: 0;
    font-size: 0.875rem;
    color: var(--vscode-editor-foreground);
    white-space: nowrap;
  }
</style>
