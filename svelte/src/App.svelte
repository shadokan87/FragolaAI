<script lang="ts">
  import { Router, Link, Route } from "svelte-routing";
  import Chat from "./routes/Chat.svelte";
  import { onMount } from "svelte";
  import { navigate } from "svelte-routing";
  import EventListener from "./lib/EventListener.svelte";
  import CodeBlock from "./lib/CodeBlock.svelte";
  import { extensionState } from "./store/chat.svelte";
  import History from "./routes/History.svelte";

  function registerCustomElements() {
    if (!customElements.get("code-block")) {
      if (!CodeBlock.element) {
        //TODO: handle error
        console.error("CodeBlock element undefinde");
        return;
      }
      customElements.define("code-block", CodeBlock.element);
    }
  }

  async function main() {
    registerCustomElements();
  }

  $effect(() => {
    main();
    navigate("/chat", { replace: true });
    if (extensionState.isDefined && extensionState.value.workspace.ui.showHistory)
    navigate("/history", {replace: true});
  });
</script>

<div id="fragolaai-app">
  <EventListener />
  <div id="content">
    {#if !extensionState.isDefined}
      <h1>{"Loading ..."}</h1>
    {:else}
      <Router>
        <Route path="/chat">
          <Chat />
        </Route>
        <Route path="/history">
          <History />
        </Route>
      </Router>
    {/if}
  </div>
</div>

<style lang="scss">

</style>