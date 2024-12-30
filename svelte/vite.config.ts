import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  base: `__VSCODE_URL__`,
  plugins: [
    svelte({
      compilerOptions: {
        customElement: true
      }
    }),
    {
      name: 'html-transform',
      transformIndexHtml(html) {
        const nonce = Buffer.from(Math.random().toString()).toString('base64')
        return html.replace(
          '<head>',
          `<head>
            <meta http-equiv="Content-Security-Policy" content="
              default-src 'self' blob: data:;
              style-src 'unsafe-inline' __VSCODE_CSP_SOURCE__;
              script-src 'unsafe-eval' 'unsafe-inline' 'nonce-${nonce}' blob: __VSCODE_CSP_SOURCE__;
              img-src __VSCODE_CSP_SOURCE__ https:;
              font-src __VSCODE_CSP_SOURCE__;
              connect-src 'self' blob: data:;
            ">`
        )
      }
    },
  ],
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        format: 'es',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        manualChunks: undefined
      }
    }
  },
  optimizeDeps: {
    include: ['shiki'],
    force: true
  },
})