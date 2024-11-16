import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  base: `__VSCODE_URL__`,
  plugins: [svelte({
    compilerOptions: {
      customElement: true
    }
  })] //buildExtensionPlugin()],
})