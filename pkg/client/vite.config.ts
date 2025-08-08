import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
	plugins: [svelte()],
	build: {
		outDir: 'dist',
		emptyOutDir: true
	},
	base: '/app/', // This sets the base path for the application
	resolve: {
		alias: {
			$shared: path.resolve(__dirname, '../shared/src'),
			'@heyketsu/shared': path.resolve(__dirname, '../shared/src'),
			$stores: path.resolve(__dirname, './src/lib/stores')
		}
	}
});
