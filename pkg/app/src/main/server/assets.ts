import { join } from 'path'
import { readdir } from 'fs/promises'

export async function scanForClientAssets(): Promise<{ js: string; css: string }> {
	try {
		// Detect if we're running from built/packaged app
		const isPackaged = __dirname.includes('app.asar')
		const clientPath = isPackaged
			? join(__dirname, 'client') // Production: client assets are in out/main/client
			: join(__dirname, '../../../client/dist') // Development: client assets in ../client/dist
		const assetsPath = join(clientPath, 'assets')

		console.log('Scanning for client assets in:', assetsPath)
		const files = await readdir(assetsPath)

		let jsFile = ''
		let cssFile = ''

		for (const file of files) {
			if (file.endsWith('.js') && file.startsWith('index-')) {
				jsFile = file
			} else if (file.endsWith('.css') && file.startsWith('index-')) {
				cssFile = file
			}
		}

		if (!jsFile || !cssFile) {
			throw new Error(`Missing client assets - JS: ${jsFile}, CSS: ${cssFile}`)
		}

		console.log('📦 Found client assets:', { js: jsFile, css: cssFile })
		return { js: jsFile, css: cssFile }
	} catch (error) {
		console.error('Error scanning client assets:', error)
		// Fallback to hardcoded values if scanning fails
		return { js: 'index-B8qUNiLk.js', css: 'index-CV3mCCdu.css' }
	}
}
