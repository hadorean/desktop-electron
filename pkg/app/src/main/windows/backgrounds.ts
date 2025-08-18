import { settingsStore } from '$shared/stores/settingsStore'
import { DefaultScreenSettings } from '$shared/types/settings'
import { BrowserWindow, screen } from 'electron'
import { attach, detach, reset } from 'electron-as-wallpaper'
import { settingsService } from '../services/settings'
import { getLocalServer, localServer, setBg } from '../stores/appStore'

type Background = {
	id: string
	index: number
	display: Electron.Display
	window: BrowserWindow | null
}

export class BackgroundManager {
	private backgrounds: Map<string, Background> = new Map()
	private serverUrl: string | null = null
	private serverUnsubscribe: (() => void) | null = null

	constructor() {
		this.serverUrl = getLocalServer()?.getUrl() ?? null
		this.setupServerWatcher()
		this.start()
	}

	start(): void {
		const displays = screen.getAllDisplays()

		console.log(`Setting up background windows for ${displays.length} monitor(s)`)

		displays.forEach((display, index) => {
			const id = `monitor${index + 1}`
			this.backgrounds.set(id, { id, index, display } as Background)
		})

		settingsStore.allSettings.subscribe(settings => {
			for (const screenId in settings.screens) {
				if (!screenId.startsWith('monitor')) continue
				const screenSettings = settings.screens[screenId]

				const bg = this.backgrounds.get(screenId)
				if (!bg) {
					console.error(`Background not found for screen ${screenId}`)
					continue
				}
				if (screenSettings.monitorEnabled) {
					if (bg.window == null) {
						const window = this.createWindow(bg)
						bg.window = window
					} else {
						bg.window.show()
					}
				} else {
					if (bg.window) {
						bg.window.destroy()
						bg.window = null
					}
				}
			}
		})

		this.backgrounds.forEach(async bg => {
			await this.saveMonitorIndex(bg.id, bg.index)
		})
	}

	private async saveMonitorIndex(monitorId: string, index: number) {
		const settings = await settingsService.getSettings()
		let screenSettings = settings.screens[monitorId]
		if (!screenSettings) {
			screenSettings = settings.screens[monitorId] = { ...DefaultScreenSettings, monitorIndex: index }
			settingsService.updateSettings(settings)
		} else if (screenSettings.monitorIndex !== index) {
			screenSettings.monitorIndex = index
			settingsService.updateSettings(settings)
		}
	}

	private createWindow(bg: Background): BrowserWindow {
		const { display, index, id } = bg

		console.log(
			`Monitor ${index}: ${display.bounds.width}x${display.bounds.height} at (${display.bounds.x}, ${display.bounds.y})`
		)

		// Platform-specific window configuration
		const windowConfig: Electron.BrowserWindowConstructorOptions = {
			x: display.bounds.x,
			y: display.bounds.y,
			width: display.bounds.width,
			height: display.bounds.height,
			backgroundColor: '#000000',
			alwaysOnTop: false,
			focusable: true,
			skipTaskbar: true,
			show: false,
			frame: false,
			// transparent: true, // Make transparent for wallpaper attachment
			resizable: false, // Prevent resizing
			minimizable: false, // Prevent minimizing
			maximizable: false, // Prevent maximizing
			closable: false, // Prevent closing
			movable: false, // Prevent moving
			webPreferences: {
				nodeIntegration: false,
				contextIsolation: true,
				webSecurity: true,
				allowRunningInsecureContent: false
				// No preload script needed for web content
			}
		}

		const window = new BrowserWindow(windowConfig)

		// Load the background webview
		const backgroundUrl = `${this.serverUrl}/app/${id}`
		console.log(`Loading background for monitor ${index}: ${backgroundUrl}`)

		window.loadURL(backgroundUrl)

		// Show the window after it's loaded and attach to wallpaper
		window.once('ready-to-show', () => {
			window.show()
			//backgroundWindow.wallpaperState.isForwardMouseInput = true
			// Attach the window to the desktop wallpaper
			try {
				attach(window, {
					transparent: false,
					forwardKeyboardInput: false, // Disable to prevent input interference
					forwardMouseInput: false // Disable to prevent input interference
				})
				console.log(`Background window ${index} attached to wallpaper`)
			} catch (error) {
				console.error(`Failed to attach background window ${index} to wallpaper:`, error)
				// Fallback to the old method
				//this.setWindowBehindOthers(backgroundWindow)
			}

			console.log(`Background window ${index} is ready`)
		})

		// Handle window errors
		window.webContents.on('did-fail-load', (_event, _errorCode, errorDescription) => {
			console.error(`Failed to load background for monitor ${index}:`, errorDescription)
		})

		// Ensure window stays behind when it gains focus
		//   backgroundWindow.on('focus', () => {
		//     this.setWindowBehindOthers(backgroundWindow)
		//   })

		//   // Ensure window stays behind when shown
		//   backgroundWindow.on('show', () => {
		//     this.setWindowBehindOthers(backgroundWindow)
		//   })

		return window
	}

	//   private setWindowBehindOthers(window: BrowserWindow): void {
	//     // Fallback method if wallpaper attachment fails
	//     if (platform() === 'win32') {
	//       window.setAlwaysOnTop(false, 'screen-saver')
	//       window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
	//       window.setMenu(null)
	//       window.setAutoHideMenuBar(true)
	//     } else if (platform() === 'darwin') {
	//       window.setAlwaysOnTop(false, 'screen-saver')
	//       window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
	//       window.setMenu(null)
	//     } else if (platform() === 'linux') {
	//       window.setAlwaysOnTop(false)
	//       window.setMenu(null)
	//     }
	//   }

	public getBackgroundWindow(monitorId: string): BrowserWindow | null {
		return this.backgrounds.get(monitorId)?.window ?? null
	}

	public getAllBackgroundWindows(): BrowserWindow[] {
		return Array.from(this.backgrounds.values())
			.map(bg => bg.window ?? null)
			.filter(window => window != null)
	}

	public reloadBackground(monitorId: string): void {
		const bg = this.backgrounds.get(monitorId)
		if (bg?.window) {
			bg.window.reload()
			console.log(`Reloaded background for monitor ${monitorId}`)
		}
	}

	public reloadAllBackgrounds(): void {
		this.backgrounds.forEach((bg, monitorId) => {
			bg.window?.reload()
			console.log(`Reloaded background for monitor ${monitorId}`)
		})
	}

	public closeAllBackgrounds(): void {
		console.log(`Closing ${this.backgrounds.size} background windows...`)

		this.backgrounds.forEach((bg, monitorId) => {
			try {
				if (bg.window) {
					// Detach from wallpaper before closing
					detach(bg.window)
				}
				console.log(`Detached background window ${monitorId} from wallpaper`)
			} catch (error) {
				console.error(`Failed to detach background window ${monitorId} from wallpaper:`, error)
			}

			// Force close the window
			if (bg.window && !bg.window.isDestroyed()) {
				bg.window.destroy()
				console.log(`Destroyed background window ${monitorId}`)
			} else {
				console.log(`Background window ${monitorId} was already destroyed`)
			}
		})

		this.backgrounds.clear()
		console.log('All background windows closed and cleared')
	}

	public resetWallpaper(): void {
		try {
			reset()
			console.log('Wallpaper reset to original')
		} catch (error) {
			console.error('Failed to reset wallpaper:', error)
		}
	}

	// Cleanup method to be called when the manager is no longer needed
	public cleanup(): void {
		console.log('BackgroundManager cleanup initiated')
		this.closeAllBackgrounds()
		this.resetWallpaper()
	}

	// Method to make a specific background window interactive
	public makeInteractive(monitorId: string): void {
		const bg = this.backgrounds.get(monitorId)
		if (bg?.window && !bg.window.isDestroyed()) {
			try {
				// Detach from wallpaper for interaction
				detach(bg.window)
				console.log(`Made background window ${monitorId} interactive (detached from wallpaper)`)
			} catch (error) {
				console.error(`Failed to make background window ${monitorId} interactive:`, error)
			}
		}
	}

	// Method to make all background windows interactive
	public makeAllInteractive(): void {
		console.log('Making all background windows interactive...')
		this.backgrounds.forEach((_window, monitorId) => {
			this.makeInteractive(monitorId)
		})
	}

	// Method to make a specific background window non-interactive (behind others)
	public makeNonInteractive(monitorId: string): void {
		const bg = this.backgrounds.get(monitorId)
		if (bg?.window && !bg.window.isDestroyed()) {
			try {
				// Re-attach to wallpaper
				attach(bg.window, {
					transparent: false,
					forwardKeyboardInput: false, // Disable to prevent input interference
					forwardMouseInput: false // Disable to prevent input interference
				})
				console.log(`Made background window ${monitorId} non-interactive (re-attached to wallpaper)`)
			} catch (error) {
				console.error(`Failed to make background window ${monitorId} non-interactive:`, error)
			}
		}
	}

	// Method to make all background windows non-interactive
	public makeAllNonInteractive(): void {
		this.backgrounds.forEach((_window, monitorId) => {
			this.makeNonInteractive(monitorId)
		})
	}

	private setupServerWatcher(): void {
		// Watch for server changes/restarts
		this.serverUnsubscribe = localServer.subscribe(server => {
			if (server) {
				const newServerUrl = server.getUrl()
				if (this.serverUrl !== newServerUrl) {
					console.log(`🔄 Server URL changed: ${this.serverUrl} → ${newServerUrl}`)
					this.serverUrl = newServerUrl
					this.reloadWindows()
				}
			}
		})
	}

	public reloadWindows(): void {
		if (!this.serverUrl) {
			console.warn('⚠️ Cannot reload windows: server URL not available')
			return
		}

		console.log('🔄 Reloading all background windows with new server URL...')
		this.backgrounds.forEach((bg, index) => {
			if (bg.window && !bg.window.isDestroyed()) {
				const monitorUrl = `monitor${index + 1}`
				const backgroundUrl = `${this.serverUrl}/app/${monitorUrl}`
				console.log(`🔄 Reloading monitor ${index}: ${backgroundUrl}`)
				bg.window.loadURL(backgroundUrl)
			}
		})
	}

	public destroy(): void {
		// Clean up watchers
		if (this.serverUnsubscribe) {
			this.serverUnsubscribe()
			this.serverUnsubscribe = null
		}
		this.cleanup()
	}
}

export const initBackgrounds = (): void => {
	const bg = new BackgroundManager()
	setBg(bg)
}
