<script lang="ts">
  import { Router, Link, Route } from "svelte-routing";
  import Chat from "./routes/Chat.svelte";
  import { onMount } from "svelte";
  import { navigate } from "svelte-routing";
  import EventListener from "./lib/EventListener.svelte";
  import CodeBlock from "./lib/CodeBlock.svelte";
  import { extensionState } from "./store/chat.svelte";
  import Nav from "./Nav.svelte";

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

  onMount(async () => {
    await main();
    navigate("/chat", { replace: true });
  });
</script>

<div class="app-grid">
  <EventListener />
  <div class="nav">
    <Nav />
  </div>
  <div class="content">
    {#if !extensionState.isDefined}
      <h1>{"Loading ..."}</h1>
    {:else}
      <Router>
        <Route path="/chat">
          <Chat />
        </Route>
      </Router>
    {/if}
  </div>
</div>

<style lang="scss">
  .app-grid {
    display: grid;
    grid-template-rows: auto 2fr;
    height: 100vh;
    width: 100%;
  }

  .nav {
    grid-row: 1;
  }

  .content {
    grid-row: 2;
    overflow-y: none;
    height: 100%;
  }
</style>