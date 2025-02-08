<script lang="ts">
    import type { TreeResult } from "../../../src/services/treeService";
    import { extensionState } from "../store/chat.svelte";
    import Flex from "./Flex.svelte";
    let children: TreeResult[] | undefined = $state(extensionState.value.workspace.tree?.children)
</script>

<Flex _class="mention-selector">
    {#each children || [] as selection}
        {selection.name}
    {/each}
</Flex>

<style>

</style>