import { getDebugMenuVisible, toggleDebugMenu } from '$shared/stores/debugStore'
import { globalShortcut } from 'electron'
import { MainWindow } from './mainWindow'

export function setupShortcuts(mainWindow: MainWindow): void {
	// (Ctrl+B) to toggle main window
	try {
		globalShortcut.register('CommandOrControl+B', () => {
			mainWindow.toggle()
		})

		globalShortcut.register('CommandOrControl+Shift+I', () => {
			const win = mainWindow.get()
			if (!win || !win.isFocused()) return
			if (!getDebugMenuVisible()) return
			win.webContents.toggleDevTools()
		})

		// (Ctrl+D) to toggle debug menu
		globalShortcut.register('CommandOrControl+D', () => {
			try {
				const win = mainWindow.get()
				if (!win || !win.isFocused()) return
				toggleDebugMenu()
			} catch (error) {
				console.error('Failed to toggle debug menu:', error)
			}
		})

		// (Ctrl+N) to toggle day/night mode
		globalShortcut.register('CommandOrControl+N', () => {
			try {
				const win = mainWindow.get()
				if (!win || !win.isFocused()) return

				// Send message directly to renderer process
				win.webContents.send('toggle-day-night-mode')
			} catch (error) {
				console.error('Failed to toggle day/night mode:', error)
			}
		})
	} catch (err) {
		console.error('Failed to register global shortcuts:', err)
	}
}

export function unregisterGlobalShortcuts(): void {
	try {
		globalShortcut.unregisterAll()
	} catch (err) {
		console.error('Failed to unregister global shortcuts:', err)
	}
}
