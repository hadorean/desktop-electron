import { initLocalServer } from './server'
import { initApp } from './services/app'
import { initAutoUpdate } from './services/auto-update'
import { initDebug } from './services/debug'
import { initIpc } from './services/ipc'
import { initUserOptions } from './services/user-options'
import { initBackgrounds } from './windows/backgrounds'
import { initMainWindow } from './windows/mainWindow'
import { initShortcuts } from './windows/shortcuts'
import { initTray } from './windows/tray'

async function start(): Promise<void> {
	await initApp()
	await initUserOptions()
	await initLocalServer()
	initBackgrounds()
	initMainWindow()
	initTray()
	initShortcuts()
	initIpc()
	initAutoUpdate()
	initDebug()
}

start()
