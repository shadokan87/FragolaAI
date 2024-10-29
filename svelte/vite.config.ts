import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import type { Plugin } from 'vite'

const VIRTUAL_MODULE_ID = 'virtual:vscode-api'
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID

const vscodePlugin = (): Plugin => {
  return {
    name: 'vscode-api-injector',
    enforce: 'pre',
    
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID
      }
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        return `
          try {
            if (typeof acquireVsCodeApi === 'function') {
              window['CODE_API'] = {...acquireVsCodeApi()};
              window.CODE_API.postMessage({
                command: 'alert',
                text: "test"
              });
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
        `
      }
    }
  }
}

export default defineConfig({
  base: `__VSCODE_URL__`,
  plugins: [svelte()],
})