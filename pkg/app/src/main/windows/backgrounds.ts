import { DefaultScreenSettings } from '$shared/types/settings'
import { BrowserWindow, screen } from 'electron'
import { attach, detach, reset } from 'electron-as-wallpaper'
import { get } from 'svelte/store'
import { settingsService } from '../services/settings'
import { getLocalServer, localServer, setBg } from '../stores/appStore'
import { monitorStore } from '../stores/monitorStore'

type Background = {
	id: string
	index: number
	display: Electron.Display
	window: BrowserWindow | null
	timeout: ReturnType<typeof setTimeout> | null
}

export class BackgroundManager {
	private backgrounds: Map<string, Background> = new Map()
	private serverUrl: string | null = null
	private serverUnsubscribe: (() => void) | null = null

	constructor() {
		this.serverUrl = getLocalServer()?.getUrl() ?? null
		this.setupServerWatcher()
	}

	start(): void {
		const displays = screen.getAllDisplays()

		console.log(`Setting up background windows for ${displays.length} monitor(s)`)

		// Create background windows for each display
		displays.forEach((display, index) => {
			const id = `monitor${index + 1}`
			this.backgrounds.set(id, { id, index, display } as Background)
		})

		// // Enable/disable background windows based on settings
		// settingsStore.userSettings.subscribe(settings => {
		// 	for (const screenId in settings.screens) {
		// 		if (!screenId.startsWith('monitor')) continue
		// 		const screenProfile = settings.screens[screenId]

		// 		const bg = this.backgrounds.get(screenId)
		// 		if (!bg) {
		// 			console.error(`Background not found for screen ${screenId}`)
		// 			continue
		// 		}
		// 		this.toggleBg(bg, screenProfile.monitorEnabled)
		// 	}
		// })

		// Ensure monitor index is saved in settings
		this.backgrounds.forEach(async bg => {
			await this.saveMonitorIndex(bg.id, bg.index)
		})

		screen.addListener('display-added', async (_event, display) => await this.addDisplay(display))
		screen.addListener('display-removed', (_event, display) => this.removeDisplay(display))
		screen.addListener('display-metrics-changed', (_event, display) => this.reloadDisplay(display))

		monitorStore.monitors.subscribe(monitors => {
			this.backgrounds.forEach((bg, monitorId) => {
				if (monitors[monitorId]) {
					this.enableBg(bg)
				} else {
					this.disableBg(bg)
				}
			})
		})
	}

	private async addDisplay(display: Electron.Display) {
		const displays = screen.getAllDisplays()
		const index = displays.findIndex(d => d.id === display.id)
		if (index !== -1) {
			const id = `monitor${index + 1}`
			console.log('display-added', id)
			const bg = { id, index, display } as Background
			this.backgrounds.set(id, bg)
			await this.saveMonitorIndex(id, index)
			const enabled = get(monitorStore.monitors)[id] ?? true
			this.toggleBg(bg, enabled)
		}
	}

	private removeDisplay(display: Electron.Display) {
		const bg = this.first(this.backgrounds, x => x.display.id === display.id)
		if (bg) {
			console.log('display-removed', bg.id)
			this.disableBg(bg)
			this.backgrounds.delete(bg.id)
		}
	}

	private first<T>(map: Map<string, T>, predicate: (value: T) => boolean): T | null {
		for (const value of map.values()) {
			if (predicate(value)) {
				return value
			}
		}
		return null
	}

	private reloadDisplay(display: Electron.Display) {
		const bg = this.first(this.backgrounds, x => x.display.id === display.id)
		if (bg) {
			console.log('display-metrics-changed', bg.id)
			this.removeDisplay(display)
			if (bg.timeout) {
				clearTimeout(bg.timeout)
				bg.timeout = null
			}
			bg.timeout = setTimeout(() => this.addDisplay(display), 1000)
		}
	}

	public toggleBg(bg: Background, enabled: boolean): void {
		if (enabled) {
			this.enableBg(bg)
		} else {
			this.disableBg(bg)
		}
	}

	private enableBg(bg: Background): void {
		if (bg.window == null) {
			const window = this.createWindow(bg)
			bg.window = window
		} else if (!bg.window.isVisible()) {
			bg.window.show()
		}
	}

	private disableBg(bg: Background): void {
		if (bg.window) {
			bg.window.destroy()
			bg.window = null
		}
	}

	private async saveMonitorIndex(monitorId: string, index: number): Promise<void> {
		const settings = await settingsService.getSettings()
		let screenProfile = settings.screens[monitorId]
		if (!screenProfile) {
			screenProfile = settings.screens[monitorId] = { ...DefaultScreenSettings, monitorIndex: index }
			settingsService.updateSettings(settings)
		} else if (screenProfile.monitorIndex !== index) {
			screenProfile.monitorIndex = index
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

export function initBackgrounds(): void {
	const bg = new BackgroundManager()
	bg.start()
	setBg(bg)
}
