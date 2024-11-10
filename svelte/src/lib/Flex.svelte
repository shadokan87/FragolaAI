<script lang="ts">
  import { interpretStyle } from "../utils/style";

    let {
        row = false,
        gap = "0",
        children,
        _class = ""
    }: {
        row?: boolean;
        gap?: string;
        children?: any;
        _class?: string;
    } = $props();
</script>

<div
    style:display="flex"
    style:flex-direction={row ? "row" : "column"}
    style:gap={interpretStyle(gap)}
    class={_class}
>
{@render children()}
</div>
