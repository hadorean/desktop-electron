#!/usr/bin/env node

/**
 * Rename .exe files to .exe_prev
 *
 * This script renames all .exe files in the dist directory to .exe_prev.
 */

const fs = require('fs')
const path = require('path')

const distPath = path.join(__dirname, '..', 'pkg', 'app', 'dist')

try {
	// Check if directory exists
	if (!fs.existsSync(distPath)) {
		console.log(`Directory ${distPath} does not exist`)
		process.exit(0)
	}

	// Read all files in the directory
	const files = fs.readdirSync(distPath)

	// Filter for .exe files
	const exeFiles = files.filter((file) => file.endsWith('.exe'))

	if (exeFiles.length === 0) {
		console.log('No .exe files found in pkg/app/dist/')
		process.exit(0)
	}

	// Rename each .exe file
	exeFiles.forEach((file) => {
		const oldPath = path.join(distPath, file)
		const newName = file.replace(/\.exe$/, '.exe_prev')
		const newPath = path.join(distPath, newName)

		try {
			fs.renameSync(oldPath, newPath)
			console.log(`Renamed ${file} to ${newName}`)
		} catch (error) {
			console.error(`Error renaming ${file}:`, error.message)
		}
	})

	console.log(`Successfully renamed ${exeFiles.length} .exe file(s)`)
} catch (error) {
	console.error('Error:', error.message)
	process.exit(1)
}
