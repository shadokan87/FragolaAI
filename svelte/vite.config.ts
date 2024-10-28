import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

const vscodePlugin = () => {
  return {
    name: 'vscode-api-injector',
    transformIndexHtml() {
      return [
        {
          tag: 'script',
          attrs: { type: 'text/javascript' },
          children: `
            try {
              if (typeof acquireVsCodeApi === 'function') {
                window.CODE_API = acquireVsCodeApi();
                window.CODE_API.postMessage({
      command: 'alert',
      text: "test"
    })
                console.log('VS Code API initialized globally as CODE_API');
              }
            } catch (e) {
              console.warn('Failed to initialize VS Code API:', e);
              // Provide a mock API for development environment
              window.CODE_API = {
                postMessage: (msg) => console.log('Mock postMessage:', msg),
                getState: () => ({}),
                setState: (state) => console.log('Mock setState:', state)
              };
            }
          `,
          injectTo: 'head-prepend' as const
        }
      ]
    }
  }
}

// https://vite.dev/config/join(assetsPath, fileName
export default defineConfig({
  base: `__VSCODE_URL__`,
  plugins: [vscodePlugin(), svelte()],
})
