import { globalShortcut } from 'electron'
import { MainWindow } from './mainWindow'
import { getDebugMenuVisible, toggleDebugMenu } from '@heyketsu/shared/stores/debugStore'

export function registerGlobalShortcuts(mainWindow: MainWindow): void {
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
