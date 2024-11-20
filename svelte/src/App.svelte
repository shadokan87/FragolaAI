<script lang="ts">
  import { Router, Link, Route } from "svelte-routing";
  import Chat from "./routes/Chat.svelte";
  import { onMount } from "svelte";
  import { navigate } from "svelte-routing";
  import EventListener from "./lib/EventListener.svelte";
  import CodeBlock from "./lib/CodeBlock.svelte";
  import { createHighlighter } from "shiki";
  import { highlighterStore } from "./store/chat.svelte";

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
    const highlighter = await createHighlighter({
      themes: [],
      langs: [],
    });
    highlighterStore.set(highlighter)
  }

  onMount(async () => {
    await main();
    navigate("/chat", { replace: true });
  });
</script>

<EventListener />
<Router>
  <Route path="/chat">
    <Chat />
  </Route>
</Router>
