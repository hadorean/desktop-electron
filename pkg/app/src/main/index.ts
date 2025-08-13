import { app } from 'electron'
import icon from '../../resources/icon.png?asset'
import { LocalServer } from './server'
import { AppContext, init } from './services/app'
import { setupAutoUpdate } from './services/auto-update'
import { setupDebug } from './services/debug'
import { setupIpc } from './services/ipc'
import { userOptionsService } from './services/user-options'
import { setAppContext } from './stores/appStore'
import { BackgroundManager } from './windows/backgrounds'
import { createWindow, mainWindow } from './windows/mainWindow'
import { setupShortcuts } from './windows/shortcuts'
import { setupTray } from './windows/tray'

const localServer = new LocalServer()
const bg = new BackgroundManager()

function start(): AppContext {
	const context = {
		app,
		icon,
		localServer,
		bg,
		mainWindow
	}

	setAppContext(context)

	createWindow()
	setupTray(context)
	setupShortcuts(mainWindow)
	setupIpc(context)
	setupAutoUpdate(mainWindow)
	setupDebug()

	// Initialize user options service
	userOptionsService.initialize().catch((error) => console.error('Failed to initialize user options service:', error))

	localServer
		.start()
		.then(() => {
			bg.start(localServer.getUrl())
		})
		.catch((error) => console.error('Failed to start local server:', error))

	return context
}

init(start)
