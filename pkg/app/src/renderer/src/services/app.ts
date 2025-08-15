import type { AppConfig } from '$shared'
import { debugMenu, toggleDayNightMode, updateUserOptions } from '$shared/stores'
import { setAppConfig } from '../stores/appConfigStore'

export async function init(): Promise<void> {
	if (!window.api) {
		console.error('No API found')
		return
	}

	let config = null as AppConfig | null

	// Get window configuration
	try {
		config = await window.api.getWindowConfig()
		setAppConfig(config)
		console.log('Desktop app: Window config:', config)
	} catch (error) {
		console.error('Failed to get window config:', error)
	}

	const result = await window.api.getUserOptions()
	updateUserOptions(current => ({ ...current, ...result.data }))

	// Setup IPC listener for debug state changes
	window.api.onDebugStateChanged(visible => {
		console.log('Desktop app: Received debug state change:', visible)
		debugMenu.setVisible(visible)
	})

	// Setup IPC listener for day/night mode toggle
	if (window.electron?.ipcRenderer) {
		window.electron.ipcRenderer.on('toggle-day-night-mode', async () => {
			try {
				toggleDayNightMode()
			} catch (error) {
				console.error('Failed to toggle day/night mode in renderer:', error)
			}
		})
	}
}
