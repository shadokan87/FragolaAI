import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { spawn } from 'child_process';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

function buildExtensionPlugin() {
  return {
    name: 'build-extension',
    closeBundle: async () => {
      console.log('Building VS Code extension...');
      try {
        // Adjust this command based on your extension's build script
        const process = spawn('npm', ['run', 'compile_no_svelte'], { 
          stdio: 'inherit',
          shell: true,
          cwd: '../'
        });

        await new Promise((resolve, reject) => {
          process.on('exit', (code) => {
            if (code === 0) {
              console.log('VS Code extension build success ✔️');
              resolve(code);
            } else {
              reject(new Error(`Extension build failed with code ${code}`));
            }
          });
        });
      } catch (error) {
        console.error('Failed to build extension:', error);
      }
    }
  };
}

export default defineConfig({
  base: `__VSCODE_URL__`,
  plugins: [svelte(), buildExtensionPlugin()],
})