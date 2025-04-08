const esbuild = require("esbuild");
const chokidar = require("chokidar"); // Import chokidar

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: 'esbuild-problem-matcher',

	setup(build) {
		build.onStart(() => {
			console.log('[watch] build started');
		});
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				console.error(`${location.file}:${location.line}:${location.column}:`);
			});
			console.log('[watch] build finished');
		});
	},
};

async function main() {
	const ctx = await esbuild.context({
		entryPoints: [
			'src/extension.ts',
			'src/workers/chat/chat.worker.ts',
			'src/workers/build/build.worker.ts',
			'src/workers/plan/plan.worker.ts',
			'src/workers/history/history.worker.mts'
		],
		bundle: true,
		format: 'cjs',
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: 'node',
		outdir: 'dist',
		outbase: 'src', // to maintain the folder structure
		external: [
			'vscode',
			'sqlite3',
			'mariasql',
			'mssql',
			'mysql',
			'mysql2',
			'tedious',
			'oracle',
			'strong-oracle',
			'oracledb',
			'pg',
			'pg-query-stream'
		],
		logLevel: 'silent',
		plugins: [
			/* add to the end of plugins array */
			esbuildProblemMatcherPlugin,
		]
	});
	if (watch) {
		await ctx.watch();

		// Initialize chokidar watcher for svelte/dist
		const watcher = chokidar.watch('svelte/dist', {
			ignored: /(^|[\/\\])\../, // ignore dotfiles
			persistent: true
		});

		watcher.on('change', (path) => {
			console.log(`[watch] Detected change in svelte/dist: ${path}`);
			// Trigger a rebuild or any other necessary action
			ctx.rebuild().then(() => {
				console.log('[watch] Rebuild triggered due to svelte/dist change');
			}).catch((e) => {
				console.error('[watch] Rebuild failed:', e);
			});
		});

		watcher.on('error', (error) => {
			console.error('[watch] Watcher error:', error);
		});
	} else {
		await ctx.rebuild();
		await ctx.dispose();
	}
}

main().catch(e => {
	console.error(e);
	process.exit(1);
});