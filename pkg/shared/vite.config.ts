import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		svelte({
			compilerOptions: {
				// Generate development-friendly code
				dev: false
			}
		})
	],
	build: {
		lib: {
			entry: path.resolve(__dirname, 'src/index.ts'),
			name: 'HeyketsuShared',
			fileName: format => `index.${format}.js`
		},
		rollupOptions: {
			external: ['svelte', 'socket.io-client', 'socket.io'],
			output: {
				globals: {
					svelte: 'Svelte'
				}
			}
		},
		outDir: 'dist',
		emptyOutDir: true
	},
	resolve: {
		alias: {
			$stores: path.resolve(__dirname, './src/stores'),
			$lib: path.resolve('./src/lib')
		}
	}
})
