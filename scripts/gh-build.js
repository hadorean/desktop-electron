#!/usr/bin/env node

/**
 * Trigger a build on GitHub Actions
 *
 * This script triggers a build on GitHub Actions by creating a tag and pushing it.
 */

const { execSync } = require('child_process')
const { updateVersion } = require('./version.js')

// Get version from command line argument
const versionArg = process.argv[2]

if (!versionArg) {
	console.error('❌ Please provide a version number or semantic keyword as an argument')
	console.error('Usage: node scripts/release.js <version>')
	console.error('Examples:')
	console.error('  node scripts/release.js 1.0.1')
	console.error('  node scripts/release.js patch')
	console.error('  node scripts/release.js minor')
	console.error('  node scripts/release.js major')
	process.exit(1)
}

try {
	// Update version and commit using the version.js module
	const { newVersion } = updateVersion(versionArg, true)

	// Git tag and push operations
	console.log('🔧 Running git tag and push operations...')

	// Create tag
	console.log(`  🏷️  Creating tag: v${newVersion}...`)
	execSync(`git tag v${newVersion}`, { stdio: 'inherit' })

	// Push to main branch
	console.log('  📤 Pushing to main branch...')
	execSync('git push origin main', { stdio: 'inherit' })

	// Push tag
	console.log(`  📤 Pushing tag v${newVersion}...`)
	execSync(`git push origin v${newVersion}`, { stdio: 'inherit' })

	console.log('\n✅ Release process completed successfully!')
	console.log(`🎉 Version ${newVersion} has been released`)
	console.log('🔗 Check GitHub Actions for build progress')
	console.log('\n📋 Debug Information:')
	console.log(`   - Tag created: v${newVersion}`)
	console.log(`   - Tag pushed to: origin/v${newVersion}`)
	console.log(`   - Workflow file: .github/workflows/release.yml`)
	console.log(`   - Expected trigger: push tags matching 'v*'`)
	console.log('\n🔍 If workflow is not running:')
	console.log('   1. Check GitHub Actions tab for syntax errors')
	console.log('   2. Verify tag format is correct (v1.0.1)')
	console.log('   3. Ensure GH_TOKEN secret is set (for private repos)')
	console.log('   4. Check repository settings → Actions → General')
} catch (error) {
	console.error('❌ Error during release process:', error.message)
	process.exit(1)
}
