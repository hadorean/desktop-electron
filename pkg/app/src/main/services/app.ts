/*
 * Init the electron app and handle main lifecycle events.
 *
 */

import { onUserOptionsChanged } from '$shared/stores/userOptionsStore'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow } from 'electron'
import { LocalServer } from '../server'
import { BackgroundManager } from '../windows/backgrounds'
import { createWindow, mainWindow, MainWindow } from '../windows/mainWindow'
import { unregisterGlobalShortcuts } from '../windows/shortcuts'

export type AppContext = {
	app: Electron.App
	icon: string | Electron.NativeImage
	bg: BackgroundManager
	localServer: LocalServer
	mainWindow: MainWindow
}

let context: AppContext | null

export function init(setup: () => Promise<AppContext>): void {
	// This method will be called when Electron has finished
	// initialization and is ready to create browser windows.
	// Some APIs can only be used after this event occurs.
	app.whenReady().then(async () => {
		// Set app user model id for windows
		electronApp.setAppUserModelId('com.electron')

		// Default open or close DevTools by F12 in development
		// and ignore CommandOrControl + R in production.
		// see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
		app.on('browser-window-created', (_, window) => {
			optimizer.watchWindowShortcuts(window)
		})

		context = await setup()
	})

	app.on('activate', function () {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})

	// Handle app quit events to ensure proper cleanup
	app.on('before-quit', () => {
		console.log('App quitting - starting cleanup...')
		mainWindow.setIsQuitting(true)
		unregisterGlobalShortcuts()
		context?.bg.cleanup()
		context?.localServer.stop()
	})

	// Force quit after a timeout if normal quit doesn't work
	app.on('will-quit', () => {
		console.log('App will quit - forcing exit...')
		unregisterGlobalShortcuts()
		setTimeout(() => {
			console.log('Forcing app exit...')
			process.exit(0)
		}, 1000)
	})

	// Quit when all windows are closed, except on macOS. There, it's common
	// for applications and their menu bar to stay active until the user quits
	// explicitly with Cmd + Q.
	app.on('window-all-closed', () => {
		if (process.platform !== 'darwin') {
			unregisterGlobalShortcuts()
			context?.bg.cleanup()
			context?.localServer.stop()
			app.quit()
		}
	})

	onUserOptionsChanged((options, previousOptions) => {
		if (options.autoStart !== previousOptions.autoStart) {
			app.setLoginItemSettings({
				openAtLogin: options.autoStart,
				openAsHidden: false
			})
		}
	})
}
