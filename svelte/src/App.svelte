<script lang="ts">
  import svelteLogo from "./assets/svelte.svg";
  import viteLogo from "/vite.svg";
  import { type ChatWorkerPayload } from "../../src/workers/chat/chat.worker";
  import OpenAI from "openai";
  import Counter from "./lib/Counter.svelte";
  // import { safeAcquireVsCodeApi } from './utils/vscode';
  import { onMount } from "svelte";
  const code = (window as any)["acquireVsCodeApi"]();
  let result = $state("");
  onMount(() => {
    window.addEventListener('message', event => {
      const chunck: OpenAI.Chat.Completions.ChatCompletionChunk = event.data;
      console.log("RECEIVED: ", event);
    //   const message = event.data;
      
    //   // Handle the message from the extension
    //   if (message.type === 'chatRequest') {
    //     response = message.data;
    //   } else if (message.type === 'error') {
    //     console.error('Error from extension:', message.error);
    //   }
    });
  });
  // console.log(window.CODE_API);
  // onMount(() => {
  //   const api = code();
  //   setInterval(() => {
  //     console.log(api);
  //     api.postMessage({
  //       command: "alert",
  //       text: "🐛  on line ",
  //     });
  //   }, 2000);
  // });
  let prompt = "";

  async function handlePromptSubmit() {
    const payload: ChatWorkerPayload = {
      type: "chatRequest",
      data: {
        prompt,
      },
    };
    code.postMessage(payload);
  }
  // onMount(() => {
  // setInterval(() => {
  // console.log(JSON.stringify(window.CODE_API, null, 2));
  // window.CODE_API.postMessage({
  //   command: 'alert',
  //   text: "test"
  // })
  //   }, 2000);
  // })
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
  <button aria-label="submit-prompt" on:click={handlePromptSubmit}
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
