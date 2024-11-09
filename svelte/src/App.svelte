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
  <div class="grid grid-rows-[auto_1fr] min-h-screen">
    <nav class="bg-gray-50 border-b border-gray-200">
        <div class="w-full mx-auto px-4 py-3">
            <div class="grid grid-cols-[auto_1fr] gap-8 items-center">
                <div class="logo">
                    <Link class="text-gray-800 hover:text-gray-600" to="/">Your App Name</Link>
                </div>
                <div class="grid auto-cols-max grid-flow-col gap-4 justify-end">
                    <Link class="text-gray-800 hover:text-gray-600" to="/chat">Chat</Link>
                </div>
            </div>
        </div>
    </nav>
    <main class="w-full mx-auto p-4">
        <Route path="/chat" component={Chat} />
    </main>
  </div>
</Router>