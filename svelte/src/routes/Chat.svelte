<script lang="ts">
    import "../app.scss";
    import ChatFooter from "../lib/ChatFooter.svelte";
    import Flex from "../lib/Flex.svelte";

</script>

<main class="chat-grid">
    <div class="chat-messages">
        <Flex gap={"sp-2"}>
            <h1>{"test1"}</h1>
            <h1>{"test2"}</h1>
        </Flex>
    </div>
    <ChatFooter />
</main>

<style lang="scss">
    .chat-grid {
        display: grid;
        grid-template-rows: 1fr auto; // Changed from auto 2fr
        height: 100vh; // Changed from 100%
    }
    .chat-messages {
        overflow-y: auto; // Added for scrolling
        background-color: --vscode-editor-background;
    }
</style>
