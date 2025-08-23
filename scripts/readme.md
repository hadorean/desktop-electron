# Scripts

This directory contains utility scripts for the project.

## Icon Generation Script

The `generate-icons.js` script generates icons in various formats for different packages from a single SVG source.

### Usage

```bash
# Using npm script (recommended)
pnpm generate-icons

# Direct execution
node scripts/generate-icons.js
```

### What it generates

1. **Chrome Extension Icons**:
   - `pkg/chrome/public/icons/logo.svg` - SVG icon
   - `pkg/chrome/public/icons/logo.ico` - ICO format
   - `pkg/chrome/public/img/logo-{16,32,48,128}.png` - PNG sizes

2. **Electron App Icons**:
   - `pkg/app/build/icon.png` - 512x512 PNG for electron-builder
   - `pkg/app/build/icon.ico` - Multi-size ICO for Windows builds
   - `pkg/app/resources/icon.png` - 512x512 PNG for app resources (used by main process)
   - `pkg/app/src/renderer/src/assets/icon.png` - 512x512 PNG for renderer assets

3. **Web Client Favicon**:
   - `pkg/client/public/favicon.ico` - Multi-size ICO favicon
   - `pkg/client/dist/favicon.ico` - Copied to dist for immediate use

### Configuration

Edit the `CONFIG` object at the top of `generate-icons.js` to customize:
- Source SVG file path
- Output file paths and directories
- PNG sizes for different packages
- ICO generation settings

### Dependencies

- `sharp` - Image processing and PNG generation
- `png-to-ico` - ICO file creation from PNGs

### Features

- Automatic directory creation
- Transparent background support
- Multiple size generation
- Temporary file cleanup
- Detailed progress logging
- Error handling and validation

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
