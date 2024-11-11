<script lang="ts">
  import { Router, Link, Route } from "svelte-routing";
  import Chat from "./routes/Chat.svelte";
  import { onMount } from "svelte";
  import { navigate } from "svelte-routing";
  import EventListener from "./lib/EventListener.svelte";

  onMount(() => {
      navigate("/chat", { replace: true });
  });
</script>

<EventListener />
<Router>
    <Route path="/chat" component={Chat} />
</Router>