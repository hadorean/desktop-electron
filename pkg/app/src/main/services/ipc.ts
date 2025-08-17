import { debugMenu } from '$shared/stores/debugStore'
import { userOptionsStore } from '$shared/stores/userOptionsStore'
import type { ScreenProfile, UserOptions } from '$shared/types'
import { appConfig } from '$shared/types/config'
import { IpcEvents, MainEvents } from '$shared/types/ipc'
import { app, dialog, ipcMain } from 'electron'
import { bg as bgStore, getBg, getLocalServer, localServer as localServerStore } from '../stores/appStore'
import { mainWindow } from '../windows/mainWindow'
import { settingsService } from './settings'
import { update } from './user-options'

let localServer = getLocalServer()
let bg = getBg()

export function initIpc(): void {
	localServerStore.subscribe(server => {
		localServer = server
	})

	bgStore.subscribe(b => {
		bg = b
	})

	// Type-safe wrappers for IPC
	const handleIpc = (event: MainEvents, handler: (...args: unknown[]) => unknown): void => {
		ipcMain.handle(event, handler)
	}

	const onIpc = (event: MainEvents, handler: (...args: unknown[]) => void): void => {
		ipcMain.on(event, handler)
	}

	// IPC test
	onIpc(IpcEvents.Ping, () => console.log('pong'))

	// IPC handlers for server communication
	handleIpc(IpcEvents.GetServerUrl, () => {
		return localServer?.getUrl()
	})

	handleIpc(IpcEvents.IsServerRunning, () => {
		return localServer?.isServerRunning()
	})

	handleIpc(IpcEvents.RestartServerWithPort, async (...args: unknown[]) => {
		try {
			const newPort = args[1] as number
			if (!localServer) {
				return { success: false, error: 'Server not available' }
			}

			console.log(`🔄 Restarting server with port ${newPort}`)
			localServer.updatePort(newPort)
			await localServer.restart()
			return { success: true, data: { port: newPort, url: localServer.getUrl() } }
		} catch (error) {
			console.error('IPC restart-server-with-port error:', error)
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
		}
	})

	handleIpc(IpcEvents.GetServerStatus, () => {
		try {
			const server = getLocalServer()
			if (!server) {
				return { success: true, data: { status: 'disconnected', port: null, url: null } }
			}

			const status = server.isServerRunning() ? 'connected' : 'disconnected'
			return {
				success: true,
				data: {
					status,
					port: server.port,
					url: server.isServerRunning() ? server.getUrl() : null
				}
			}
		} catch (error) {
			console.error('IPC get-server-status error:', error)
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
		}
	})

	// IPC handler for app version
	handleIpc(IpcEvents.GetAppVersion, () => {
		return app.getVersion()
	})

	// IPC handlers for background management
	handleIpc(IpcEvents.ReloadBackground, (...args: unknown[]) => {
		const monitorId = args[1] as number
		bg?.reloadBackground(monitorId)
	})

	handleIpc(IpcEvents.ReloadAllBackgrounds, () => {
		bg?.reloadAllBackgrounds()
	})

	// IPC handlers for background interactivity
	handleIpc(IpcEvents.MakeBackgroundInteractive, (...args: unknown[]) => {
		const monitorId = args[1] as number
		bg?.makeInteractive(monitorId)
	})

	handleIpc(IpcEvents.MakeAllBackgroundsInteractive, () => {
		bg?.makeAllInteractive()
	})

	handleIpc(IpcEvents.MakeBackgroundNonInteractive, (...args: unknown[]) => {
		const monitorId = args[1] as number
		bg?.makeNonInteractive(monitorId)
	})

	handleIpc(IpcEvents.MakeAllBackgroundsNonInteractive, () => {
		bg?.makeAllNonInteractive()
	})

	// IPC handlers for settings
	handleIpc(IpcEvents.SettingsGet, async () => {
		try {
			const settings = await settingsService.getSettings()
			return { success: true, data: settings }
		} catch (error) {
			console.error('IPC settings-get error:', error)
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
		}
	})

	handleIpc(IpcEvents.SettingsUpdateShared, async (...args: unknown[]) => {
		try {
			const settings = args[1] as Partial<ScreenProfile>
			const currentSettings = await settingsService.getSettings()
			const updatedSettings = {
				shared: {
					...currentSettings.shared,
					...settings
				}
			}
			const updateEvent = await settingsService.updateSettings(updatedSettings, 'ipc-client')
			return { success: true, data: updateEvent.settings }
		} catch (error) {
			console.error('IPC settings-update-shared error:', error)
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
		}
	})

	handleIpc(IpcEvents.SettingsUpdateLocal, async (...args: unknown[]) => {
		try {
			const screenId = args[1] as string
			const settings = args[2] as Partial<ScreenProfile>
			const currentSettings = await settingsService.getSettings()
			const updatedSettings = {
				screens: {
					...currentSettings.screens,
					[screenId]: {
						...currentSettings.screens[screenId],
						...settings
					}
				}
			}
			const updateEvent = await settingsService.updateSettings(updatedSettings, 'ipc-client')
			return { success: true, data: updateEvent.settings }
		} catch (error) {
			console.error('IPC settings-update-local error:', error)
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
		}
	})

	handleIpc(IpcEvents.SettingsIsAvailable, async () => {
		try {
			await settingsService.getSettings()
			return { success: true, data: true }
		} catch (error) {
			console.error('IPC settings-is-available error:', error)
			return { success: false, data: false }
		}
	})

	// IPC handler to get current debug state
	handleIpc(IpcEvents.GetDebugState, () => {
		try {
			return { success: true, visible: debugMenu.getVisible() }
		} catch (error) {
			console.error('IPC get-debug-state error:', error)
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
		}
	})

	// Window control
	handleIpc(IpcEvents.MinimizeWindow, () => {
		mainWindow.get()?.minimize()
	})

	handleIpc(IpcEvents.MaximizeWindow, () => {
		const window = mainWindow.get()
		if (window) {
			if (window.isMaximized()) {
				window.unmaximize()
			} else {
				window.maximize()
			}
		}
	})

	handleIpc(IpcEvents.CloseWindow, () => {
		mainWindow.get()?.close()
	})

	// Window configuration
	handleIpc(IpcEvents.GetWindowConfig, () => {
		return appConfig
	})

	handleIpc(IpcEvents.RecreateMainWindow, () => {
		mainWindow.recreate()
	})

	// File System
	handleIpc(IpcEvents.ShowOpenDialog, async (...args: unknown[]) => {
		try {
			const options = (args[1] as Electron.OpenDialogOptions) || {}
			const window = mainWindow.get()
			const dialogOptions: Electron.OpenDialogOptions = {
				properties: ['openDirectory'],
				...options
			}
			const result = window
				? await dialog.showOpenDialog(window, dialogOptions)
				: await dialog.showOpenDialog(dialogOptions)
			return { success: true, data: result }
		} catch (error) {
			console.error('IPC show-open-dialog error:', error)
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
		}
	})

	// User Options
	handleIpc(IpcEvents.GetUserOptions, async () => {
		try {
			const options = userOptionsStore.getCurrent()
			return { success: true, data: options }
		} catch (error) {
			console.error('IPC get-user-options error:', error)
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
		}
	})

	handleIpc(IpcEvents.UpdateUserOptions, async (...args: unknown[]) => {
		try {
			const options = args[1] as Partial<UserOptions>
			const updateEvent = await update(options, 'ipc-client')
			return { success: true, data: updateEvent.options }
		} catch (error) {
			console.error('IPC update-user-options error:', error)
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
		}
	})
}
