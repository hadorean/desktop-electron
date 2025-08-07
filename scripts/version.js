#!/usr/bin/env node

/**
 * Update the version in the package.json file
 *
 * This script updates the version in the package.json file based on the provided version number or semantic keyword.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get version from command line argument
const versionArg = process.argv[2];

if (!versionArg) {
	console.error('❌ Please provide a version number or semantic keyword as an argument');
	console.error('Usage: node scripts/version.js <version>');
	console.error('Examples:');
	console.error('  node scripts/version.js 1.0.1');
	console.error('  node scripts/version.js patch');
	console.error('  node scripts/version.js minor');
	console.error('  node scripts/version.js major');
	process.exit(1);
}

const packageJsonPath = path.join(__dirname, '../pkg/app/package.json');

// Function to calculate new version based on semantic keyword
function calculateNewVersion(currentVersion, keyword) {
	const parts = currentVersion.split('.').map(Number);

	switch (keyword) {
		case 'patch':
			return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
		case 'minor':
			return `${parts[0]}.${parts[1] + 1}.0`;
		case 'major':
			return `${parts[0] + 1}.0.0`;
		default:
			throw new Error(`Invalid semantic keyword: ${keyword}`);
	}
}

function updateVersion(versionArg, shouldCommit = true) {
	try {
		// Read current package.json
		console.log('📖 Reading package.json...');
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

		const currentVersion = packageJson.version;
		console.log(`📦 Current version: ${currentVersion}`);

		// Determine the new version
		let version;
		const semanticKeywords = ['patch', 'minor', 'major'];

		if (semanticKeywords.includes(versionArg)) {
			// Calculate new version based on semantic keyword
			version = calculateNewVersion(currentVersion, versionArg);
			console.log(`🚀 New version (${versionArg}): ${version}`);
		} else {
			// Use provided version directly
			version = versionArg;

			// Validate version format (semantic versioning)
			const versionRegex = /^\d+\.\d+\.\d+$/;
			if (!versionRegex.test(version)) {
				console.error(
					'❌ Invalid version format. Please use semantic versioning (e.g., 1.0.1) or a semantic keyword (patch, minor, major)'
				);
				process.exit(1);
			}

			console.log(`🚀 New version: ${version}`);
		}

		// Check if version is actually different
		if (currentVersion === version) {
			console.error('❌ Version is already set to', version);
			process.exit(1);
		}

		// Update version in package.json
		console.log('✏️  Updating version in package.json...');
		packageJson.version = version;
		fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

		if (shouldCommit) {
			// Git operations
			console.log('🔧 Running git operations...');

			// Add all changes
			console.log('  📝 Adding all changes...');
			execSync('git add .', { stdio: 'inherit' });

			// Commit with version message
			console.log(`  💾 Committing with message: "Version ${version}"...`);
			execSync(`git commit -m "Version ${version}"`, { stdio: 'inherit' });
		}

		console.log(`✅ Version updated to ${version}${shouldCommit ? ' and committed' : ''}`);
		return { currentVersion, newVersion: version };
	} catch (error) {
		console.error('❌ Error during version update:', error.message);

		// Try to revert package.json if there was an error
		try {
			console.log('🔄 Attempting to revert package.json...');
			const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
			if (typeof currentVersion !== 'undefined') {
				packageJson.version = currentVersion;
				fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
				console.log('✅ Package.json reverted');
			}
		} catch (revertError) {
			console.error('❌ Failed to revert package.json:', revertError.message);
		}

		process.exit(1);
	}
}

// If called directly (not imported)
if (require.main === module) {
	updateVersion(versionArg);
}

module.exports = { updateVersion, calculateNewVersion };
