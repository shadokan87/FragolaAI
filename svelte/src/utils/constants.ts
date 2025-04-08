import {type CreateTooltipProps} from "@melt-ui/svelte";

export const defaultToolTipProps: CreateTooltipProps = {
    positioning: {
      placement: 'top',
    },
    openDelay: 300,
    closeDelay: 0,
    forceVisible: true,
    disableHoverableContent: true
  }
