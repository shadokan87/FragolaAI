<script lang="ts">
    import { findToolCallFromResponse, type ToolMessageType } from "../../../../common";
    import { extensionState } from "../../store/chat.svelte";
    interface props {
        index: number
    }
    const {index} = $props();
    const found = findToolCallFromResponse(extensionState.value.workspace.messages[index] as ToolMessageType, extensionState.value.workspace.messages)
</script>
<p>{JSON.stringify(found)}</p>
<style lang="scss">

</style>