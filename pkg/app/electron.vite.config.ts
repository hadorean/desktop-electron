import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'fs'
import { join, resolve } from 'path'

// Custom plugin to copy templates and client assets after build
const copyAssetsPlugin = (): { name: string; writeBundle: () => void } => ({
	name: 'copy-assets',
	writeBundle() {
		const templatesSourceDir = join(__dirname, 'src/main/templates')
		const templatesDestDir = join(__dirname, 'out/main/templates')
		const clientSourceDir = join(__dirname, '../client/dist')
		const clientDestDir = join(__dirname, 'out/main/client')

		try {
			// Copy templates
			mkdirSync(templatesDestDir, { recursive: true })
			copyFileSync(join(templatesSourceDir, 'app.ejs'), join(templatesDestDir, 'app.ejs'))
			console.log('✅ Templates copied to build output')

			// Copy client assets
			if (existsSync(clientSourceDir)) {
				mkdirSync(clientDestDir, { recursive: true })

				// Copy client files recursively
				const copyDir = (src: string, dest: string): void => {
					const entries = readdirSync(src, { withFileTypes: true })

					for (const entry of entries) {
						const srcPath = join(src, entry.name)
						const destPath = join(dest, entry.name)

						if (entry.isDirectory()) {
							mkdirSync(destPath, { recursive: true })
							copyDir(srcPath, destPath)
						} else {
							copyFileSync(srcPath, destPath)
						}
					}
				}

				copyDir(clientSourceDir, clientDestDir)
				console.log('✅ Client assets copied to build output')
			} else {
				console.log('⚠️  Client assets not found, run client build first')
			}
		} catch (error) {
			console.error('❌ Failed to copy assets:', error)
		}
	}
})

export default defineConfig({
	main: {
		plugins: [externalizeDepsPlugin(), copyAssetsPlugin()],
		resolve: {
			alias: {
				$shared: resolve(__dirname, '../shared/src')
			}
		}
	},
	preload: {
		plugins: [externalizeDepsPlugin()],
		resolve: {
			alias: {
				$shared: resolve(__dirname, '../shared/src')
			}
		}
	},
	renderer: {
		plugins: [svelte()],
		resolve: {
			alias: {
				$shared: resolve(__dirname, '../shared/src')
			}
		}
	}
})
