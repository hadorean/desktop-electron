#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get version from command line argument
const versionArg = process.argv[2];

if (!versionArg) {
	console.error('❌ Please provide a version number or semantic keyword as an argument');
	console.error('Usage: node scripts/release.js <version>');
	console.error('Examples:');
	console.error('  node scripts/release.js 1.0.1');
	console.error('  node scripts/release.js patch');
	console.error('  node scripts/release.js minor');
	console.error('  node scripts/release.js major');
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

	// Git operations
	console.log('🔧 Running git operations...');

	// Add all changes
	console.log('  📝 Adding all changes...');
	execSync('git add .', { stdio: 'inherit' });

	// Commit with version message
	console.log(`  💾 Committing with message: "Version ${version}"...`);
	execSync(`git commit -m "Version ${version}"`, { stdio: 'inherit' });

	// Create tag
	console.log(`  🏷️  Creating tag: v${version}...`);
	execSync(`git tag v${version}`, { stdio: 'inherit' });

	// Push to main branch
	console.log('  📤 Pushing to main branch...');
	execSync('git push origin main', { stdio: 'inherit' });

	// Push tag
	console.log(`  📤 Pushing tag v${version}...`);
	execSync(`git push origin v${version}`, { stdio: 'inherit' });

	console.log('\n✅ Release process completed successfully!');
	console.log(`🎉 Version ${version} has been released`);
	console.log('🔗 Check GitHub Actions for build progress');
	console.log('\n📋 Debug Information:');
	console.log(`   - Tag created: v${version}`);
	console.log(`   - Tag pushed to: origin/v${version}`);
	console.log(`   - Workflow file: .github/workflows/release.yml`);
	console.log(`   - Expected trigger: push tags matching 'v*'`);
	console.log('\n🔍 If workflow is not running:');
	console.log('   1. Check GitHub Actions tab for syntax errors');
	console.log('   2. Verify tag format is correct (v1.0.1)');
	console.log('   3. Ensure GH_TOKEN secret is set (for private repos)');
	console.log('   4. Check repository settings → Actions → General');
} catch (error) {
	console.error('❌ Error during release process:', error.message);

	// Try to revert package.json if there was an error
	try {
		console.log('🔄 Attempting to revert package.json...');
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
		packageJson.version = currentVersion;
		fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
		console.log('✅ Package.json reverted');
	} catch (revertError) {
		console.error('❌ Failed to revert package.json:', revertError.message);
	}

	process.exit(1);
}
