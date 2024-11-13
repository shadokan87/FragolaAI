<script lang="ts">
  import { interpretStyle } from "../utils/style";
  import { classNames as cn, type ClassNamesObject } from "../utils/style";

    let {
        row = false,
        gap = "0",
        children,
        _class = "",
        justifyStart = false,
        justifyEnd = false,
        justifyCenter = false,
        justifyBetween = false,
        justifyAround = false,
        justifyEvenly = false
    }: {
        row?: boolean;
        gap?: string;
        children?: any;
        _class?: string;
        justifyStart?: boolean;
        justifyEnd?: boolean;
        justifyCenter?: boolean;
        justifyBetween?: boolean;
        justifyAround?: boolean;
        justifyEvenly?: boolean;
    } = $props();

    const justify: string = $derived((() => {
        const _cn = cn({
        "flex-start": justifyStart,
        "flex-end": justifyEnd,
        "center": justifyCenter,
        "space-between": justifyBetween,
        "space-around": justifyAround,
        "space-evenly": justifyEvenly
    })
    if (_cn.length != 0)
        return `justify-content: ${_cn}`;
    return "";
    })());
</script>

<div
    style:display="flex"
    style:flex-direction={row ? "row" : "column"}
    style:gap={interpretStyle(gap)}
    class={_class}
    style={justify}
>
{@render children()}
</div>
