# Auto-Update System Setup

This Electron app is configured with automatic updates using `electron-updater` and GitHub releases.

## How it Works

1. **GitHub Actions Workflow**: When you push a tag (e.g., `v1.0.1`), the GitHub Actions workflow automatically builds the app for Windows, macOS, and Linux
2. **GitHub Releases**: The built artifacts are automatically uploaded to a GitHub release
3. **Auto-Update**: The app checks for updates on startup and notifies users when new versions are available

## Setup Instructions

### 1. GitHub Repository Setup

1. Ensure your repository is public (or you have a GitHub token with appropriate permissions)
2. The workflow uses the default `GITHUB_TOKEN` secret which is automatically available

### 2. Publishing a New Release

To publish a new version:

1. **Update the version** in `package.json`:

   ```json
   {
   	"version": "1.0.1"
   }
   ```

2. **Create and push a git tag**:

   ```bash
   git add .
   git commit -m "Release v1.0.1"
   git tag v1.0.1
   git push origin main
   git push origin v1.0.1
   ```

3. **The GitHub Actions workflow will automatically**:
   - Build the app for all platforms (Windows, macOS, Linux)
   - Create a GitHub release with the tag
   - Upload the built artifacts to the release

### 3. Manual Release (Optional)

You can also trigger a release manually:

1. Go to your GitHub repository
2. Click on "Actions" tab
3. Select "Build and Release" workflow
4. Click "Run workflow"
5. Enter the version number (e.g., "1.0.1")
6. Click "Run workflow"

## Auto-Update Features

### In the App

- **Automatic Check**: The app checks for updates 3 seconds after startup (production builds only)
- **Manual Check**: Users can click "Check for Updates" in the app
- **Download Progress**: Shows download progress with a progress bar
- **Install Prompt**: When update is downloaded, users can install it immediately

### Update Flow

1. App checks for updates on startup
2. If update is available, shows notification
3. User can download the update
4. Download progress is shown
5. When download completes, user can install the update
6. App restarts with the new version

## Configuration Files

### electron-builder.yml

- Configured for GitHub releases
- Builds for Windows (NSIS + Portable), macOS (DMG + ZIP), Linux (AppImage + Snap + DEB)
- Auto-publishes to GitHub releases

### GitHub Actions Workflow (.github/workflows/release.yml)

- Triggers on tag pushes and manual workflow dispatch
- Builds on Windows, macOS, and Linux
- Creates GitHub releases automatically

## Troubleshooting

### Common Issues

1. **Updates not working in development**:
   - Auto-update only works in production builds
   - Development builds skip update checks

2. **GitHub token issues**:
   - Ensure repository is public, or
   - Add a personal access token with `repo` scope as `GH_TOKEN` secret

3. **Build failures**:
   - Check GitHub Actions logs for specific errors
   - Ensure all dependencies are properly installed

### Debugging

- Check the main process console for auto-update logs
- Use the "Check for Updates" button in the app to manually trigger updates
- Monitor GitHub Actions workflow for build status

## Security Notes

- The app uses GitHub's built-in security features
- Updates are signed and verified automatically
- Only releases from your repository are trusted
