import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'fs'
import { join, resolve } from 'path'

// Plugin to copy all assets (SVG, images, etc.) for renderer
const copyRendererAssetsPlugin = (): { name: string; writeBundle: () => void } => ({
	name: 'copy-renderer-assets',
	writeBundle() {
		const rendererAssetsSourceDir = join(__dirname, 'src/renderer/src/assets')
		const rendererAssetsDestDir = join(__dirname, 'out/renderer/assets')

		try {
			if (!existsSync(rendererAssetsSourceDir)) {
				console.log('⚠️  Renderer assets source directory not found')
				return
			}

			// Copy all assets recursively
			const copyAssets = (srcDir: string, destDir: string): void => {
				const entries = readdirSync(srcDir, { withFileTypes: true })

				for (const entry of entries) {
					const srcPath = join(srcDir, entry.name)
					const destPath = join(destDir, entry.name)

					if (entry.isDirectory()) {
						mkdirSync(destPath, { recursive: true })
						copyAssets(srcPath, destPath)
					} else {
						// Only copy image and SVG files
						const ext = entry.name.toLowerCase().split('.').pop()
						if (ext && ['svg', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'bmp'].includes(ext)) {
							copyFileSync(srcPath, destPath)
						}
					}
				}
			}

			mkdirSync(rendererAssetsDestDir, { recursive: true })
			copyAssets(rendererAssetsSourceDir, rendererAssetsDestDir)
			console.log('✅ Renderer assets copied to build output')
		} catch (error) {
			console.error('❌ Failed to copy renderer assets:', error)
		}
	}
})

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
		plugins: [svelte(), copyRendererAssetsPlugin()],
		resolve: {
			alias: {
				$shared: resolve(__dirname, '../shared/src')
			}
		},
		assetsInclude: ['**/*.svg'],
		build: {
			rollupOptions: {
				output: {
					assetFileNames: 'assets/[name].[ext]'
				},
				external: (id) => {
					// Don't externalize SVG imports
					if (id.endsWith('.svg')) return false
					return false
				}
			}
		}
	}
})
