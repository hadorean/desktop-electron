# Scripts

This directory contains utility scripts for the project.

## Release Script

The `release.js` script automates the release process for the Electron app.

### Usage

```bash
# Using npm script (recommended)
npm run release <version>

# Direct execution
node scripts/release.js <version>
```

### Examples

```bash
# Release version 1.0.1
npm run release 1.0.1

# Release version 2.1.0
npm run release 2.1.0
```

### What it does

1. **Validates version format** - Ensures semantic versioning (e.g., 1.0.1)
2. **Updates package.json** - Sets the new version in `pkg/app/package.json`
3. **Git operations**:
   - `git add .` - Stages all changes
   - `git commit -m "Version X.X.X"` - Commits with version message
   - `git tag vX.X.X` - Creates version tag
   - `git push origin main` - Pushes to main branch
   - `git push origin vX.X.X` - Pushes the tag

4. **Triggers GitHub Actions** - The tag push triggers the build and release workflow

### Requirements

- Git repository with remote origin
- Write access to the repository
- Node.js installed

### Error Handling

- Validates version format before proceeding
- Checks if version is already set
- Reverts package.json changes if any step fails
- Provides clear error messages

### Workflow Integration

After running the release script:

1. GitHub Actions workflow automatically builds the app
2. Creates a GitHub release with the tag
3. Uploads built artifacts for Windows, macOS, and Linux
4. Users can download and auto-update to the new version
