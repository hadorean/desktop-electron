#!/usr/bin/env node

/**
 * Create a release on GitHub
 *
 * This script creates a release on GitHub by uploading the latest distribution files.
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

function main() {
	try {
		// Read version from pkg/app/package.json
		const packageJsonPath = path.join(__dirname, '..', 'pkg', 'app', 'package.json')
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
		const version = packageJson.version

		console.log(`📦 Creating release for version ${version}`)

		// Define file paths
		const distDir = path.join(__dirname, '..', 'pkg', 'app', 'dist')
		const setupExe = path.join(distDir, `heyketsu-${version}-setup.exe`)
		const latestYml = path.join(distDir, 'latest.yml')
		const blockmap = path.join(distDir, `heyketsu-${version}-setup.exe.blockmap`)

		// Check if files exist
		const filesToUpload = [setupExe, latestYml]
		if (fs.existsSync(blockmap)) {
			filesToUpload.push(blockmap)
		}

		for (const file of filesToUpload) {
			if (!fs.existsSync(file)) {
				console.error(`❌ File not found: ${file}`)
				console.error('Please run "npm run build:win" first to generate distribution files')
				process.exit(1)
			}
		}

		console.log(`✅ Found all required files:`)
		filesToUpload.forEach(file => {
			const stats = fs.statSync(file)
			const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2)
			console.log(`   - ${path.basename(file)} (${sizeInMB} MB)`)
		})

		// Create the gh release command
		const tagName = `v${version}`
		const releaseTitle = `Release ${version}`

		const command = [
			'gh',
			'release',
			'create',
			tagName,
			...filesToUpload.map(f => `"${f}"`),
			'--title',
			`"${releaseTitle}"`,
			'--notes',
			`""`
		].join(' ')

		console.log(`\n🚀 Creating GitHub release...`)
		console.log(`Command: ${command}\n`)

		// Check if release already exists
		try {
			execSync(`gh release view ${tagName}`, {
				stdio: 'pipe',
				cwd: path.join(__dirname, '..')
			})

			console.log(`⚠️  Release ${tagName} already exists!`)
			console.log(`🔗 View at: https://github.com/hgrandry/desktop-electron/releases/tag/${tagName}`)
			console.log(`\nTo create a new release:`)
			console.log(`1. Bump version in pkg/app/package.json`)
			console.log(`2. Run "npm run package:win" to rebuild`)
			console.log(`3. Run "npm run create-release" again`)
			return
		} catch (error) {
			// Release doesn't exist, continue with creation
		}

		// Execute the command
		execSync(command, {
			stdio: 'inherit',
			cwd: path.join(__dirname, '..')
		})

		console.log(`\n✅ Successfully created release ${tagName}`)
		console.log(`🔗 View at: https://github.com/hgrandry/desktop-electron/releases/tag/${tagName}`)
	} catch (error) {
		console.error('❌ Error creating release:', error.message)
		process.exit(1)
	}
}

if (require.main === module) {
	main()
}

module.exports = { main }
