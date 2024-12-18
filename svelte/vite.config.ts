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
              default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;
              style-src * 'unsafe-inline' 'unsafe-eval' data: blob:;
              script-src * 'unsafe-inline' 'unsafe-eval' data: blob:;
              img-src * data: blob:;
              font-src * data: blob:;
              connect-src * data: blob:;
              worker-src * data: blob:;
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
        entryFileNames: 'assets/[name].js',
        manualChunks: undefined
      }
    }
  },
  optimizeDeps: {
    include: ['shiki'],
    force: true
  },
})