#!/usr/bin/env node

/**
 * Copy the shared package to the app's node_modules
 *
 * This script copies the shared package to the app's node_modules.
 */

const fs = require('fs')
const path = require('path')
const chokidar = require('chokidar')

// Define source and target paths
const sharedDistPath = path.join(__dirname, '..', 'pkg', 'shared', 'dist')
const sharedPackageJsonPath = path.join(__dirname, '..', 'pkg', 'shared', 'package.json')
const targetDir = path.join(__dirname, '..', 'pkg', 'app', 'out', 'shared')

// Copy dist directory
function copyDirectory(src, dest) {
	if (!fs.existsSync(src)) return

	fs.mkdirSync(dest, { recursive: true })
	const items = fs.readdirSync(src)

	items.forEach(item => {
		const srcPath = path.join(src, item)
		const destPath = path.join(dest, item)

		if (fs.statSync(srcPath).isDirectory()) {
			copyDirectory(srcPath, destPath)
		} else {
			fs.copyFileSync(srcPath, destPath)
		}
	})
}

function copySharedPackage() {
	// Create target directory
	fs.mkdirSync(targetDir, { recursive: true })

	// Copy shared dist to target/dist (preserve dist directory structure)
	const targetDistDir = path.join(targetDir, 'dist')
	copyDirectory(sharedDistPath, targetDistDir)

	// Copy package.json
	if (fs.existsSync(sharedPackageJsonPath)) {
		fs.copyFileSync(sharedPackageJsonPath, path.join(targetDir, 'package.json'))
	}

	console.log('✅ Shared package copied to node_modules')
}

// Check if we should watch for changes
const watchMode = process.argv.includes('--watch')

if (watchMode) {
	console.log('👀 Watching shared package for changes...')

	// Initial copy
	copySharedPackage()

	// Watch for changes in the shared dist directory
	const watcher = chokidar.watch(sharedDistPath, {
		ignored: /node_modules/,
		persistent: true,
		ignoreInitial: true,
		awaitWriteFinish: {
			stabilityThreshold: 100,
			pollInterval: 100
		}
	})

	let copyTimeout
	function debouncedCopy(reason) {
		clearTimeout(copyTimeout)
		copyTimeout = setTimeout(() => {
			console.log(`🔄 Shared package ${reason}, copying...`)
			copySharedPackage()
		}, 200)
	}

	watcher.on('change', () => debouncedCopy('changed'))
	watcher.on('add', () => debouncedCopy('added'))
	watcher.on('unlink', () => debouncedCopy('removed'))

	// Keep the process running
	process.on('SIGINT', () => {
		console.log('\n👋 Stopping shared package watcher...')
		watcher.close()
		process.exit(0)
	})
} else {
	// One-time copy
	copySharedPackage()
}
