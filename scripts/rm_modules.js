#!/usr/bin/env node

/**
 * Cleanup node_modules in the current repository
 *
 * This script finds and removes all node_modules directories recursively
 * from the current repository, including nested ones and those in build artifacts.
 * It also handles package-lock files and provides options for different cleanup levels.
 */

const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const { exec } = require('child_process')

const execAsync = promisify(exec)

// Configuration
const CONFIG = {
	dryRun: process.argv.includes('--dry-run') || process.argv.includes('-n'),
	verbose: process.argv.includes('--verbose') || process.argv.includes('-v'),
	deep: process.argv.includes('--deep') || process.argv.includes('-d'),
	keepPackageLock: process.argv.includes('--keep-lock'),
	showHelp: process.argv.includes('--help') || process.argv.includes('-h')
}

// Colors for console output
const colors = {
	reset: '\x1b[0m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
	white: '\x1b[37m'
}

function colorize(text, color) {
	return process.stdout.isTTY ? `${colors[color]}${text}${colors.reset}` : text
}

function showHelp() {
	console.log(`
${colorize('Node.js node_modules Cleanup Script', 'cyan')}

${colorize('Usage:', 'yellow')} node cleanup-node-modules.js [options]

${colorize('Options:', 'yellow')}
  -n, --dry-run      Show what would be deleted without actually deleting
  -v, --verbose      Show detailed information about the cleanup process
  -d, --deep         Also remove build artifacts and dist directories
  --keep-lock        Keep package-lock.json files (remove by default)
  -h, --help         Show this help message

${colorize('Examples:', 'yellow')}
  node cleanup-node-modules.js --dry-run     # Preview what will be deleted
  node cleanup-node-modules.js --verbose     # Run with detailed output
  node cleanup-node-modules.js --deep        # Also remove build artifacts
  node cleanup-node-modules.js --keep-lock   # Keep package-lock.json files

${colorize('Note:', 'yellow')} This script is designed for the electron-bg monorepo structure.
`)
}

// Statistics tracking
const stats = {
	nodeModulesRemoved: 0,
	lockFilesRemoved: 0,
	buildArtifactsRemoved: 0,
	totalSizeFreed: 0,
	errors: []
}

// Platform-specific path handling
const isWindows = process.platform === 'win32'

/**
 * Get the size of a directory recursively
 */
async function getDirectorySize(dirPath) {
	try {
		if (isWindows) {
			// Use PowerShell on Windows for better performance with large directories
			const { stdout } = await execAsync(
				`powershell "(Get-ChildItem -Recurse -File '${dirPath}' | Measure-Object -Property Length -Sum).Sum"`
			)
			return parseInt(stdout.trim()) || 0
		} else {
			const { stdout } = await execAsync(`du -sb "${dirPath}" | cut -f1`)
			return parseInt(stdout.trim()) || 0
		}
	} catch (error) {
		if (CONFIG.verbose) {
			console.log(colorize(`Warning: Could not calculate size for ${dirPath}: ${error.message}`, 'yellow'))
		}
		return 0
	}
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes) {
	if (bytes === 0) return '0 Bytes'

	const k = 1024
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
	const i = Math.floor(Math.log(bytes) / Math.log(k))

	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Remove a directory recursively
 */
async function removeDirectory(dirPath) {
	try {
		if (isWindows) {
			// Use rmdir on Windows for better handling of long paths and permissions
			await execAsync(`rmdir /s /q "${dirPath}"`)
		} else {
			await execAsync(`rm -rf "${dirPath}"`)
		}
		return true
	} catch (error) {
		stats.errors.push(`Failed to remove ${dirPath}: ${error.message}`)
		return false
	}
}

/**
 * Remove a file
 */
async function removeFile(filePath) {
	try {
		await fs.promises.unlink(filePath)
		return true
	} catch (error) {
		stats.errors.push(`Failed to remove ${filePath}: ${error.message}`)
		return false
	}
}

/**
 * Check if a directory exists
 */
async function directoryExists(dirPath) {
	try {
		const stat = await fs.promises.stat(dirPath)
		return stat.isDirectory()
	} catch {
		return false
	}
}

/**
 * Check if a file exists
 */
async function fileExists(filePath) {
	try {
		const stat = await fs.promises.stat(filePath)
		return stat.isFile()
	} catch {
		return false
	}
}

/**
 * Find all directories matching a pattern recursively
 */
async function findDirectories(startPath, patterns = ['node_modules']) {
	const results = []

	async function traverse(currentPath) {
		try {
			const entries = await fs.promises.readdir(currentPath, { withFileTypes: true })

			for (const entry of entries) {
				if (!entry.isDirectory()) continue

				const fullPath = path.join(currentPath, entry.name)

				// Check if this directory matches any of our patterns
				if (patterns.includes(entry.name)) {
					results.push(fullPath)
					// Don't traverse into node_modules directories
					continue
				}

				// Skip common directories that shouldn't contain node_modules
				const skipDirs = ['.git', '.hg', '.svn', 'build', 'dist', 'out']
				if (skipDirs.includes(entry.name)) {
					continue
				}

				// Recursively traverse subdirectories
				await traverse(fullPath)
			}
		} catch (error) {
			if (CONFIG.verbose) {
				console.log(colorize(`Warning: Could not read directory ${currentPath}: ${error.message}`, 'yellow'))
			}
		}
	}

	await traverse(startPath)
	return results
}

/**
 * Find package-lock.json files
 */
async function findPackageLockFiles(startPath) {
	const results = []

	async function traverse(currentPath) {
		try {
			const entries = await fs.promises.readdir(currentPath, { withFileTypes: true })

			for (const entry of entries) {
				const fullPath = path.join(currentPath, entry.name)

				if (
					entry.isFile() &&
					(entry.name === 'package-lock.json' || entry.name === 'pnpm-lock.yaml' || entry.name === 'yarn.lock')
				) {
					results.push(fullPath)
				} else if (entry.isDirectory() && entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
					await traverse(fullPath)
				}
			}
		} catch (error) {
			if (CONFIG.verbose) {
				console.log(colorize(`Warning: Could not read directory ${currentPath}: ${error.message}`, 'yellow'))
			}
		}
	}

	await traverse(startPath)
	return results
}

/**
 * Find build artifacts (dist, build, out directories)
 */
async function findBuildArtifacts(startPath) {
	const buildDirs = ['dist', 'build', 'out', '.next', '.nuxt', 'coverage']
	return await findDirectories(startPath, buildDirs)
}

/**
 * Main cleanup function
 */
async function cleanup() {
	const startTime = Date.now()
	const rootPath = process.cwd()

	console.log(colorize('\n🧹 Node.js node_modules Cleanup Script', 'cyan'))
	console.log(colorize('=====================================', 'cyan'))

	if (CONFIG.dryRun) {
		console.log(colorize('\n🔍 DRY RUN MODE - No files will be deleted\n', 'yellow'))
	}

	console.log(`Root directory: ${colorize(rootPath, 'blue')}\n`)

	// Phase 1: Find all node_modules directories
	console.log(colorize('Phase 1: Finding node_modules directories...', 'magenta'))
	const nodeModulesDirs = await findDirectories(rootPath, ['node_modules'])

	if (nodeModulesDirs.length === 0) {
		console.log(colorize('✨ No node_modules directories found!', 'green'))
	} else {
		console.log(`Found ${colorize(nodeModulesDirs.length, 'yellow')} node_modules directories:`)

		for (const dir of nodeModulesDirs) {
			const relativePath = path.relative(rootPath, dir)
			const size = CONFIG.dryRun || CONFIG.verbose ? await getDirectorySize(dir) : 0

			if (CONFIG.verbose || CONFIG.dryRun) {
				console.log(
					`  ${colorize('📁', 'blue')} ${relativePath} ${size > 0 ? colorize(`(${formatBytes(size)})`, 'cyan') : ''}`
				)
			}

			if (!CONFIG.dryRun) {
				if (CONFIG.verbose) {
					process.stdout.write(`    Removing... `)
				}

				if (await removeDirectory(dir)) {
					stats.nodeModulesRemoved++
					stats.totalSizeFreed += size

					if (CONFIG.verbose) {
						console.log(colorize('✅ Done', 'green'))
					}
				} else if (CONFIG.verbose) {
					console.log(colorize('❌ Failed', 'red'))
				}
			}
		}
	}

	// Phase 2: Handle package-lock.json files
	if (!CONFIG.keepPackageLock) {
		console.log(colorize('\nPhase 2: Finding package-lock.json files...', 'magenta'))
		const lockFiles = await findPackageLockFiles(rootPath)

		if (lockFiles.length === 0) {
			console.log(colorize('✨ No package-lock.json files found!', 'green'))
		} else {
			console.log(`Found ${colorize(lockFiles.length, 'yellow')} package-lock.json files:`)

			for (const file of lockFiles) {
				const relativePath = path.relative(rootPath, file)

				if (CONFIG.verbose || CONFIG.dryRun) {
					console.log(`  ${colorize('📄', 'blue')} ${relativePath}`)
				}

				if (!CONFIG.dryRun) {
					if (CONFIG.verbose) {
						process.stdout.write(`    Removing... `)
					}

					if (await removeFile(file)) {
						stats.lockFilesRemoved++

						if (CONFIG.verbose) {
							console.log(colorize('✅ Done', 'green'))
						}
					} else if (CONFIG.verbose) {
						console.log(colorize('❌ Failed', 'red'))
					}
				}
			}
		}
	} else {
		console.log(colorize('\nPhase 2: Keeping package-lock.json files (--keep-lock flag)', 'yellow'))
	}

	// Phase 3: Handle build artifacts (if --deep flag is used)
	if (CONFIG.deep) {
		console.log(colorize('\nPhase 3: Finding build artifacts (--deep mode)...', 'magenta'))
		const buildDirs = await findBuildArtifacts(rootPath)

		if (buildDirs.length === 0) {
			console.log(colorize('✨ No build artifacts found!', 'green'))
		} else {
			console.log(`Found ${colorize(buildDirs.length, 'yellow')} build artifact directories:`)

			for (const dir of buildDirs) {
				const relativePath = path.relative(rootPath, dir)
				const size = CONFIG.dryRun || CONFIG.verbose ? await getDirectorySize(dir) : 0

				if (CONFIG.verbose || CONFIG.dryRun) {
					console.log(
						`  ${colorize('🏗️', 'blue')} ${relativePath} ${size > 0 ? colorize(`(${formatBytes(size)})`, 'cyan') : ''}`
					)
				}

				if (!CONFIG.dryRun) {
					if (CONFIG.verbose) {
						process.stdout.write(`    Removing... `)
					}

					if (await removeDirectory(dir)) {
						stats.buildArtifactsRemoved++
						stats.totalSizeFreed += size

						if (CONFIG.verbose) {
							console.log(colorize('✅ Done', 'green'))
						}
					} else if (CONFIG.verbose) {
						console.log(colorize('❌ Failed', 'red'))
					}
				}
			}
		}
	}

	// Summary
	const endTime = Date.now()
	const duration = ((endTime - startTime) / 1000).toFixed(2)

	console.log(colorize('\n📊 Cleanup Summary', 'cyan'))
	console.log(colorize('==================', 'cyan'))
	console.log(`${colorize('node_modules removed:', 'white')} ${colorize(stats.nodeModulesRemoved, 'green')}`)
	console.log(`${colorize('package-lock.json removed:', 'white')} ${colorize(stats.lockFilesRemoved, 'green')}`)

	if (CONFIG.deep) {
		console.log(`${colorize('Build artifacts removed:', 'white')} ${colorize(stats.buildArtifactsRemoved, 'green')}`)
	}

	console.log(`${colorize('Total space freed:', 'white')} ${colorize(formatBytes(stats.totalSizeFreed), 'green')}`)
	console.log(`${colorize('Time taken:', 'white')} ${colorize(duration + 's', 'green')}`)

	if (stats.errors.length > 0) {
		console.log(colorize(`\n⚠️ Errors encountered (${stats.errors.length}):`, 'red'))
		stats.errors.forEach(error => console.log(`  ${colorize('•', 'red')} ${error}`))
	}

	if (CONFIG.dryRun) {
		console.log(colorize('\n💡 This was a dry run. To actually delete files, run without --dry-run', 'yellow'))
	} else {
		console.log(colorize('\n✨ Cleanup completed successfully!', 'green'))
		console.log(colorize('💡 Run "npm install" to reinstall dependencies when needed', 'blue'))
	}
}

// Main execution
if (CONFIG.showHelp) {
	showHelp()
	process.exit(0)
}

cleanup().catch(error => {
	console.error(colorize(`\n❌ Cleanup failed: ${error.message}`, 'red'))
	process.exit(1)
})
