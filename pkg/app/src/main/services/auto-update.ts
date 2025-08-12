import { IpcEvents, MainEvents, RendererEvents } from '$shared/types/ipc'
import { ipcMain } from 'electron'
import { autoUpdater, UpdateInfo } from 'electron-updater'
import { MainWindow } from '../windows/mainWindow'

export function setupAutoUpdate(mainWindow: MainWindow): {
	checkForUpdates: () => void
	downloadUpdate: () => void
	installUpdate: () => void
	instance: typeof autoUpdater
} {
	// Configure auto-updater
	autoUpdater.autoDownload = false
	autoUpdater.autoInstallOnAppQuit = true

	// Type-safe IPC wrappers
	const handleIpc = (event: MainEvents, handler: () => void): void => {
		ipcMain.handle(event, handler)
	}

	const sendToRenderer = (event: RendererEvents, data: unknown): void => {
		const window = mainWindow.get()
		if (window) {
			window.webContents.send(event, data)
		}
	}

	// Auto-updater event handlers
	autoUpdater.on('checking-for-update', () => {
		console.log('Checking for updates...')
	})

	autoUpdater.on('update-available', (info: UpdateInfo) => {
		console.log('Update available:', info)
		sendToRenderer(IpcEvents.UpdateAvailable, {
			version: info.version,
			releaseDate: info.releaseDate,
			releaseNotes: info.releaseNotes
		})
	})

	autoUpdater.on('update-not-available', (info) => {
		console.log('Update not available:', info)
	})

	autoUpdater.on('error', (err) => {
		console.error('Auto-updater error:', err)
	})

	autoUpdater.on('download-progress', (progressObj) => {
		console.log('Download progress:', progressObj)
		sendToRenderer(IpcEvents.UpdateDownloadProgress, progressObj)
	})

	autoUpdater.on('update-downloaded', (info) => {
		console.log('Update downloaded:', info)
		sendToRenderer(IpcEvents.UpdateDownloaded, info)
	})

	// IPC handlers for auto-update
	handleIpc(IpcEvents.CheckForUpdates, () => {
		autoUpdater.checkForUpdates()
	})

	handleIpc(IpcEvents.DownloadUpdate, () => {
		autoUpdater.downloadUpdate()
	})

	handleIpc(IpcEvents.InstallUpdate, () => {
		autoUpdater.quitAndInstall()
	})

	autoUpdater.checkForUpdates()

	// Expose a small API for programmatic use
	return {
		checkForUpdates: () => autoUpdater.checkForUpdates(),
		downloadUpdate: () => autoUpdater.downloadUpdate(),
		installUpdate: () => autoUpdater.quitAndInstall(),
		instance: autoUpdater
	}
}
