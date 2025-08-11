import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// Config for standalone web demo (no backend required)
export default defineConfig({
	plugins: [svelte()],
	build: {
		outDir: 'demo',
		emptyOutDir: true
	},
	base: './', // Relative paths for standalone deployment
	server: {
		port: 3000
	}
});
