#!/usr/bin/env node

const { execSync } = require('child_process')

try {
	// Get the commit messages before reset
	const oldestMessage = execSync('git log --format=%s -n 1 HEAD~1', { encoding: 'utf-8' }).trim()
	const newestMessage = execSync('git log --format=%s -n 1 HEAD', { encoding: 'utf-8' }).trim()

	console.log(`Oldest commit: ${oldestMessage}`)
	console.log(`Newest commit: ${newestMessage}`)

	// Reset the last two commits
	execSync('git reset --soft HEAD~2', { stdio: 'inherit' })

	// Create new commit with oldest as title and newest as description
	// Use multiple -m flags: first for title, second for description
	execSync(`git commit -m "${oldestMessage}" -m "${newestMessage}"`, { stdio: 'inherit' })

	console.log('\nSuccessfully squashed last two commits!')
	console.log(`New commit message:\n${oldestMessage}\n\n${newestMessage}`)
} catch (error) {
	console.error('Error squashing commits:', error.message)
	process.exit(1)
}
