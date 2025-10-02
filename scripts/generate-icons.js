#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import pngToIco from 'png-to-ico'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ============================================================================
// CONFIGURATION - Edit these values to customize icon generation
// ============================================================================

const CONFIG = {
	// Source SVG file
	sourceSvg: path.join(__dirname, '../pkg/shared/src/assets/icons/logo.svg'),

	// Output configurations for each package
	outputs: {
		chrome: {
			// Chrome extension icons
			icons: {
				svg: path.join(__dirname, '../pkg/chrome/public/icons/logo.svg'),
				ico: path.join(__dirname, '../pkg/chrome/public/icons/logo.ico')
			},
			img: {
				sizes: [16, 32, 48, 128],
				outputDir: path.join(__dirname, '../pkg/chrome/public/img'),
				filename: 'logo'
			}
		},
		electron: {
			// Build directory icons for electron-builder
			build: {
				icon: path.join(__dirname, '../pkg/app/build/icon.png'),
				ico: path.join(__dirname, '../pkg/app/build/icon.ico')
			},
			// Resources and renderer icons
			resources: {
				icon: path.join(__dirname, '../pkg/app/resources/icon.png')
			},
			renderer: {
				icon: path.join(__dirname, '../pkg/app/src/renderer/src/assets/icon.png')
			}
		},
		client: {
			// Web client favicon
			favicon: path.join(__dirname, '../pkg/client/public/favicon.ico')
		}
	},

	// PNG generation settings
	pngSettings: {
		background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent background
		format: 'png'
	},

	// ICO generation settings
	icoSettings: {
		sizes: [16, 32, 48, 64, 128, 256], // Sizes to include in ICO files
		quality: 100
	}
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Ensure directory exists, create if it doesn't
 */
function ensureDir(dirPath) {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true })
		console.log(`Created directory: ${dirPath}`)
	}
}

/**
 * Generate PNG from SVG at specified size
 */
async function generatePng(svgPath, outputPath, size) {
	try {
		await sharp(svgPath).resize(size, size).png(CONFIG.pngSettings).toFile(outputPath)

		console.log(`Generated PNG: ${outputPath} (${size}x${size})`)
		return outputPath
	} catch (error) {
		console.error(`Error generating PNG ${size}x${size}:`, error.message)
		throw error
	}
}

/**
 * Generate ICO file from multiple PNG sizes
 */
async function generateIco(pngPaths, outputPath) {
	try {
		const icoBuffer = await pngToIco(pngPaths)
		fs.writeFileSync(outputPath, icoBuffer)
		console.log(`Generated ICO: ${outputPath}`)
	} catch (error) {
		console.error(`Error generating ICO:`, error.message)
		throw error
	}
}

/**
 * Copy SVG file to destination
 */
function copySvg(sourcePath, destPath) {
	try {
		ensureDir(path.dirname(destPath))
		fs.copyFileSync(sourcePath, destPath)
		console.log(`Copied SVG: ${destPath}`)
	} catch (error) {
		console.error(`Error copying SVG:`, error.message)
		throw error
	}
}

// ============================================================================
// MAIN GENERATION FUNCTIONS
// ============================================================================

/**
 * Generate Chrome extension icons
 */
async function generateChromeIcons() {
	console.log('\n=== Generating Chrome Extension Icons ===')

	const { icons, img } = CONFIG.outputs.chrome

	// Copy SVG
	copySvg(CONFIG.sourceSvg, icons.svg)

	// Generate PNGs for different sizes
	const pngPaths = []
	for (const size of img.sizes) {
		const outputPath = path.join(img.outputDir, `${img.filename}-${size}.png`)
		ensureDir(img.outputDir)
		const pngPath = await generatePng(CONFIG.sourceSvg, outputPath, size)
		pngPaths.push(pngPath)
	}

	// Generate ICO from PNGs
	await generateIco(pngPaths, icons.ico)
}

/**
 * Generate Electron app icon
 */
async function generateElectronIcon() {
	console.log('\n=== Generating Electron App Icons ===')

	const { build, resources, renderer } = CONFIG.outputs.electron

	// Generate build directory icons
	ensureDir(path.dirname(build.icon))
	await generatePng(CONFIG.sourceSvg, build.icon, 512)

	// Generate ICO for build directory
	const tempPngPaths = []
	for (const size of CONFIG.icoSettings.sizes) {
		const tempPath = path.join(__dirname, `../temp/build-icon-${size}.png`)
		ensureDir(path.dirname(tempPath))
		const pngPath = await generatePng(CONFIG.sourceSvg, tempPath, size)
		tempPngPaths.push(pngPath)
	}

	await generateIco(tempPngPaths, build.ico)

	// Clean up temporary PNG files
	for (const tempPath of tempPngPaths) {
		fs.unlinkSync(tempPath)
	}
	console.log('Cleaned up temporary build PNG files')

	// Generate resources icon
	ensureDir(path.dirname(resources.icon))
	await generatePng(CONFIG.sourceSvg, resources.icon, 512)

	// Generate renderer icon
	ensureDir(path.dirname(renderer.icon))
	await generatePng(CONFIG.sourceSvg, renderer.icon, 512)
}

/**
 * Copy favicon to client dist directory if it exists
 */
function copyFaviconToDist() {
	const faviconSource = CONFIG.outputs.client.favicon
	const faviconDest = path.join(__dirname, '../pkg/client/dist/favicon.ico')

	if (fs.existsSync(faviconSource)) {
		ensureDir(path.dirname(faviconDest))
		fs.copyFileSync(faviconSource, faviconDest)
		console.log(`📋 Copied favicon to client dist: ${faviconDest}`)
	}
}

/**
 * Generate web client favicon
 */
async function generateClientFavicon() {
	console.log('\n=== Generating Web Client Favicon ===')

	const { favicon } = CONFIG.outputs.client
	ensureDir(path.dirname(favicon))

	// Generate PNGs for ICO creation
	const tempPngPaths = []
	for (const size of CONFIG.icoSettings.sizes) {
		const tempPath = path.join(__dirname, `../temp/favicon-${size}.png`)
		ensureDir(path.dirname(tempPath))
		const pngPath = await generatePng(CONFIG.sourceSvg, tempPath, size)
		tempPngPaths.push(pngPath)
	}

	// Generate ICO favicon
	await generateIco(tempPngPaths, favicon)

	// Clean up temporary PNG files
	for (const tempPath of tempPngPaths) {
		fs.unlinkSync(tempPath)
	}
	console.log('Cleaned up temporary PNG files')
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
	console.log('🚀 Starting icon generation...')

	// Validate source file exists
	if (!fs.existsSync(CONFIG.sourceSvg)) {
		console.error(`❌ Source SVG file not found: ${CONFIG.sourceSvg}`)
		process.exit(1)
	}

	try {
		// Generate icons for all packages
		await generateChromeIcons()
		await generateElectronIcon()
		await generateClientFavicon()

		// Copy favicon to client dist for immediate use
		copyFaviconToDist()

		console.log('\n✅ Icon generation completed successfully!')
		console.log('\nGenerated files:')
		console.log('📁 Chrome Extension:')
		console.log(`   - ${CONFIG.outputs.chrome.icons.svg}`)
		console.log(`   - ${CONFIG.outputs.chrome.icons.ico}`)
		CONFIG.outputs.chrome.img.sizes.forEach(size => {
			console.log(
				`   - ${path.join(CONFIG.outputs.chrome.img.outputDir, `${CONFIG.outputs.chrome.img.filename}-${size}.png`)}`
			)
		})

		console.log('\n📱 Electron App:')
		console.log(`   - ${CONFIG.outputs.electron.build.icon}`)
		console.log(`   - ${CONFIG.outputs.electron.build.ico}`)
		console.log(`   - ${CONFIG.outputs.electron.resources.icon}`)
		console.log(`   - ${CONFIG.outputs.electron.renderer.icon}`)

		console.log('\n🌐 Web Client:')
		console.log(`   - ${CONFIG.outputs.client.favicon}`)
	} catch (error) {
		console.error('\n❌ Icon generation failed:', error.message)
		process.exit(1)
	}
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
	main()
}

export { CONFIG, copyFaviconToDist, generateChromeIcons, generateClientFavicon, generateElectronIcon }
