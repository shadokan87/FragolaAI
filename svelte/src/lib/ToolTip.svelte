<script lang="ts">
  import { createTooltip, melt, CreateTooltipProps } from '@melt-ui/svelte';
  import { fade } from 'svelte/transition';
  import { defaultToolTipProps } from '../utils/constants';


  interface props {
    children: any,
    text: string,
    custom?: CreateTooltipProps
  }
  let {
    children,
    text,
    custom = defaultToolTipProps
  }: props = $props();
  const {
    elements: { trigger, content, arrow },
    states: { open },
  } = createTooltip(custom);
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
    <div use:melt={$arrow} class="tooltip-arrow" />
    <p class="tooltip-text">{text}</p>
  </div>
{/if}

<style lang="scss">
  div {
    display: inline-block;
  }

  .tooltip-content {
    z-index: 50;
    border-radius: 0.5rem;
    background-color: var(--vscode-editor-background);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border: 1px solid var(--vscode-input-border);
  }

//   .tooltip-arrow {
//     position: absolute;
//     width: 8px;
//     height: 8px;
//     background: inherit;
//     transform: rotate(45deg);
//     background-color: var(--vscode-editor-background);
//     border: 1px solid var(--vscode-input-border);
//   }

  .tooltip-text {
    padding: 0.25rem 0.75rem;
    margin: 0;
    font-size: 0.875rem;
    color: var(--vscode-editor-foreground);
    white-space: nowrap;
  }
</style>