#!/usr/bin/env node

/**
 * Move .exe and .blockmap files to prev directory
 *
 * This script moves all .exe and .blockmap files in the dist directory to dist/prev.
 */

const fs = require('fs')
const path = require('path')

const distPath = path.join(__dirname, '..', 'pkg', 'app', 'dist')
const prevPath = path.join(distPath, 'prev')

try {
	// Check if directory exists
	if (!fs.existsSync(distPath)) {
		console.log(`Directory ${distPath} does not exist`)
		process.exit(0)
	}

	// Create prev directory if it doesn't exist
	if (!fs.existsSync(prevPath)) {
		fs.mkdirSync(prevPath, { recursive: true })
		console.log(`Created directory ${prevPath}`)
	}

	// Read all files in the directory
	const files = fs.readdirSync(distPath)

	// Filter for .exe and .blockmap files (excluding the prev directory itself)
	const targetFiles = files.filter(file => (file.endsWith('.exe') || file.endsWith('.blockmap')) && file !== 'prev')

	if (targetFiles.length === 0) {
		console.log('No .exe or .blockmap files found in pkg/app/dist/')
		process.exit(0)
	}

	// Move each target file
	targetFiles.forEach(file => {
		const oldPath = path.join(distPath, file)
		const newPath = path.join(prevPath, file)

		try {
			fs.renameSync(oldPath, newPath)
			console.log(`Moved ${file} to prev/`)
		} catch (error) {
			console.error(`Error moving ${file}:`, error.message)
		}
	})

	console.log(`Successfully moved ${targetFiles.length} file(s) to prev/`)
} catch (error) {
	console.error('Error:', error.message)
	process.exit(1)
}
