<script lang="ts">
    import { onMount } from "svelte";
    import { codeStore } from "../store/vscode";
    onMount(() => {
        if (!$codeStore) {
            const code = (window as any)["acquireVsCodeApi"]();
            if (!code) {
                //TODO: handle error
                console.error("Failed to acquire code api");
                return ;
            }
            codeStore.set(code);
        }
    });
</script>
