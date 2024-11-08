<script lang="ts">
  import svelteLogo from "./assets/svelte.svg";
  import viteLogo from "/vite.svg";
  import { type ChatWorkerPayload } from "../../src/workers/chat/chat.worker";
  import OpenAI from "openai";
  import { onMount } from "svelte";
  import { v4 } from "uuid";

  const code = (window as any)["acquireVsCodeApi"]();
  let result = $state("tedfjdslkvvlljlj");
  onMount(() => {
    window.addEventListener('message', event => {
      const chunck: OpenAI.Chat.Completions.ChatCompletionChunk = event.data;
      console.log("RECEIVED: ", event);
    });
  });
  let prompt = $state("");

  async function handlePromptSubmit() {
    const payload: ChatWorkerPayload = {
      type: "chatRequest",
      id: v4(),
      data: {
        prompt,
      },
    };
    code.postMessage(payload);
  }
</script>

<main>
  <div>
    <a href="https://vite.dev" target="_blank" rel="noreferrer">
      <img src={viteLogo} class="logo" alt="Vite Logo" />
    </a>
    <a href="https://svelte.dev" target="_blank" rel="noreferrer">
      <img src={svelteLogo} class="logo svelte" alt="Svelte Logo" />
    </a>
  </div>
  <h1>Vite + Svelte</h1>

  <div class="card">
    <input bind:value={prompt} />
  </div>
  <button aria-label="submit-prompt" onclick={handlePromptSubmit}
    >Submit</button
  >

  <p>
    Check out <a
      href="https://github.com/sveltejs/kit#readme"
      target="_blank"
      rel="noreferrer">SvelteKit</a
    >, the official Svelte app framework powered by Vite!
  </p>

  <p class="read-the-docs">Click on the Vite and Svelte logos to learn more</p>
</main>

<style>
  .logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }
  .logo.svelte:hover {
    filter: drop-shadow(0 0 2em #ff3e00aa);
  }
  .read-the-docs {
    color: #888;
  }
</style>
