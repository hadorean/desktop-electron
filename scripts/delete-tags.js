#!/usr/bin/env node

/**
 * Delete tags matching a pattern both locally and remotely
 *
 * Usage: node scripts/delete-v0.1-tags.js [pattern]
 * Example: node scripts/delete-v0.1-tags.js "v0.1.*"
 */

const { execSync } = require('child_process')
const chalk = require('chalk')

class TagCleaner {
	constructor(pattern = 'v0.1.*') {
		this.remoteName = 'origin'
		this.tagPattern = pattern
	}

	/**
	 * Execute a shell command and return the output
	 */
	execCommand(command, silent = false) {
		try {
			const output = execSync(command, {
				encoding: 'utf8',
				stdio: silent ? 'pipe' : 'inherit'
			})
			return output ? output.trim() : ''
		} catch (error) {
			if (!silent) {
				console.error(chalk.red(`Error executing command: ${command}`))
				console.error(chalk.red(error.message))
			}
			throw error
		}
	}

	/**
	 * Get all local tags matching the pattern
	 */
	getLocalTags() {
		try {
			const output = this.execCommand(`git tag -l "${this.tagPattern}"`, true)
			return output ? output.split('\n').filter((tag) => tag.trim()) : []
		} catch (error) {
			console.warn(chalk.yellow('Failed to get local tags'))
			return []
		}
	}

	/**
	 * Convert shell glob pattern to regex
	 */
	globToRegex(glob) {
		// Escape special regex characters except * and ?
		let regex = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&')
		// Convert shell wildcards to regex
		regex = regex.replace(/\*/g, '.*').replace(/\?/g, '.')
		return new RegExp(`^${regex}$`)
	}

	/**
	 * Get all remote tags matching the pattern
	 */
	getRemoteTags() {
		try {
			const output = this.execCommand(`git ls-remote --tags ${this.remoteName}`, true)
			const remoteTags = []
			const tagRegex = this.globToRegex(this.tagPattern)

			if (output) {
				const lines = output.split('\n')
				for (const line of lines) {
					const match = line.match(/refs\/tags\/([^\^]+)$/)
					if (match && tagRegex.test(match[1])) {
						remoteTags.push(match[1])
					}
				}
			}

			return remoteTags
		} catch (error) {
			console.warn(chalk.yellow('Failed to get remote tags'))
			return []
		}
	}

	/**
	 * Delete local tags
	 */
	deleteLocalTags(tags) {
		if (tags.length === 0) {
			console.log(chalk.blue(`No local tags matching "${this.tagPattern}" to delete`))
			return
		}

		console.log(chalk.blue(`\nDeleting ${tags.length} local tags:`))
		console.log(chalk.gray(tags.join(', ')))

		try {
			const command = `git tag -d ${tags.join(' ')}`
			this.execCommand(command)
			console.log(chalk.green('✓ Local tags deleted successfully'))
		} catch (error) {
			console.error(chalk.red('✗ Failed to delete local tags'))
			throw error
		}
	}

	/**
	 * Delete remote tags
	 */
	deleteRemoteTags(tags) {
		if (tags.length === 0) {
			console.log(chalk.blue(`No remote tags matching "${this.tagPattern}" to delete`))
			return
		}

		console.log(chalk.blue(`\nDeleting ${tags.length} remote tags:`))
		console.log(chalk.gray(tags.join(', ')))

		try {
			// Delete tags in batches to avoid command line length limits
			const batchSize = 10
			for (let i = 0; i < tags.length; i += batchSize) {
				const batch = tags.slice(i, i + batchSize)
				const command = `git push ${this.remoteName} --delete ${batch.join(' ')}`
				this.execCommand(command)
			}
			console.log(chalk.green('✓ Remote tags deleted successfully'))
		} catch (error) {
			console.error(chalk.red('✗ Failed to delete remote tags'))
			throw error
		}
	}

	/**
	 * Verify we're in a git repository
	 */
	verifyGitRepo() {
		try {
			this.execCommand('git rev-parse --git-dir', true)
		} catch (error) {
			console.error(chalk.red('Error: Not in a git repository'))
			process.exit(1)
		}
	}

	/**
	 * Verify remote exists
	 */
	verifyRemote() {
		try {
			this.execCommand(`git remote get-url ${this.remoteName}`, true)
		} catch (error) {
			console.error(chalk.red(`Error: Remote '${this.remoteName}' does not exist`))
			process.exit(1)
		}
	}

	/**
	 * Display help information
	 */
	showHelp() {
		console.log(chalk.bold.cyan('🏷️  Tag Cleaner - Delete git tags locally and remotely\n'))
		console.log(chalk.white('Usage:'))
		console.log(chalk.gray('  node scripts/delete-v0.1-tags.js [pattern]'))
		console.log(chalk.gray('  npm run delete-v0.1-tags [pattern]\n'))
		console.log(chalk.white('Arguments:'))
		console.log(chalk.gray('  pattern    Tag pattern to match (default: "v0.1.*")\n'))
		console.log(chalk.white('Examples:'))
		console.log(chalk.gray('  node scripts/delete-v0.1-tags.js "v0.1.*"'))
		console.log(chalk.gray('  node scripts/delete-v0.1-tags.js "v2.*"'))
		console.log(chalk.gray('  node scripts/delete-v0.1-tags.js "beta-*"'))
		console.log(chalk.gray('  node scripts/delete-v0.1-tags.js "*-rc*"\n'))
		console.log(chalk.white('Options:'))
		console.log(chalk.gray('  -h, --help    Show this help message'))
	}

	/**
	 * Main execution function
	 */
	async run() {
		console.log(chalk.bold.cyan(`🏷️  Tag Cleaner - Deleting tags matching "${this.tagPattern}"\n`))

		// Verify prerequisites
		this.verifyGitRepo()
		this.verifyRemote()

		// Get tags
		console.log(chalk.blue('Collecting tags...'))
		const localTags = this.getLocalTags()
		const remoteTags = this.getRemoteTags()

		console.log(chalk.gray(`Found ${localTags.length} local tags matching "${this.tagPattern}"`))
		console.log(chalk.gray(`Found ${remoteTags.length} remote tags matching "${this.tagPattern}"`))

		if (localTags.length === 0 && remoteTags.length === 0) {
			console.log(chalk.green(`\n✓ No tags matching "${this.tagPattern}" found to delete`))
			return
		}

		// Show the tags that will be deleted
		console.log('')
		if (localTags.length > 0) {
			console.log(chalk.cyan('Local tags to be deleted:'))
			console.log(chalk.gray('  ' + localTags.join(', ')))
		}
		if (remoteTags.length > 0) {
			console.log(chalk.cyan('Remote tags to be deleted:'))
			console.log(chalk.gray('  ' + remoteTags.join(', ')))
		}

		// Confirm deletion
		const readline = require('readline')
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		})

		const allTags = new Set([...localTags, ...remoteTags])
		const totalTags = allTags.size
		const question = chalk.yellow(`\n⚠️  This will delete ${totalTags} tags matching "${this.tagPattern}". Continue? (y/N): `)

		rl.question(question, (answer) => {
			rl.close()

			if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
				console.log(chalk.gray('Operation cancelled'))
				return
			}

			try {
				// Delete local tags first
				this.deleteLocalTags(localTags)

				// Then delete remote tags
				this.deleteRemoteTags(remoteTags)

				console.log(chalk.bold.green(`\n🎉 All tags matching "${this.tagPattern}" deleted successfully!`))
			} catch (error) {
				console.error(chalk.red('\n💥 Operation failed'))
				process.exit(1)
			}
		})
	}
}

// Parse command line arguments
function parseArgs() {
	const args = process.argv.slice(2)

	// Check for help flags
	if (args.includes('-h') || args.includes('--help')) {
		const cleaner = new TagCleaner()
		cleaner.showHelp()
		process.exit(0)
	}

	// Get pattern argument (first non-flag argument)
	const pattern = args.find((arg) => !arg.startsWith('-'))
	return pattern
}

// Run the script
if (require.main === module) {
	const pattern = parseArgs()
	const cleaner = new TagCleaner(pattern)
	cleaner.run().catch((error) => {
		console.error(chalk.red('Unexpected error:'), error)
		process.exit(1)
	})
}

module.exports = TagCleaner
