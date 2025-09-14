import { globalShortcut } from 'electron'

export function initShortcuts(): void {
	// (Ctrl+B) to toggle main window
	try {
		// globalShortcut.register('CommandOrControl+Shift+B', () => {
		// 	getMainWindow()?.toggle()
		// })
		// globalShortcut.register('CommandOrControl+Shift+I', () => {
		// 	const win = getMainWindow()?.get()
		// 	if (!win || !win.isFocused()) return
		// 	if (!debugMenu.getVisible()) return
		// 	win.webContents.toggleDevTools()
		// })
		// // (Ctrl+D) to toggle debug menu
		// globalShortcut.register('CommandOrControl+Shift+D', () => {
		// 	try {
		// 		const win = getMainWindow()?.get()
		// 		if (!win || !win.isFocused()) return
		// 		debugMenu.toggle()
		// 	} catch (error) {
		// 		console.error('Failed to toggle debug menu:', error)
		// 	}
		// })
		// // (Ctrl+N) to toggle day/night mode
		// globalShortcut.register('CommandOrControl+Shift+N', () => {
		// 	try {
		// 		const win = getMainWindow()?.get()
		// 		if (!win || !win.isFocused()) return
		// 		// Send message directly to renderer process
		// 		win.webContents.send('toggle-day-night-mode')
		// 	} catch (error) {
		// 		console.error('Failed to toggle day/night mode:', error)
		// 	}
		// })
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
