<script lang="ts">
  import { Router, Link, Route } from "svelte-routing";
  import Chat from "./routes/Chat.svelte";
  import { onMount } from "svelte";
  import { navigate } from "svelte-routing";
  import EventListener from "./lib/EventListener.svelte";
  import CodeBlock from "./lib/CodeBlock.svelte";

  function registerCustomElements() {
    if (!customElements.get("code-block")) {
      if (!CodeBlock.element) {
        //TODO: handle error
        console.error("CodeBlock element undefinde");
        return ;
      }
      customElements.define("code-block", CodeBlock.element);
    }
  }

  function main() {
    registerCustomElements();
  }

  onMount(() => {
    main();
    navigate("/chat", { replace: true });
  });
</script>

<EventListener />
<Router>
  <Route path="/chat">
    <Chat />
  </Route>
</Router>
