import { app, Menu, shell, Tray } from 'electron'
import icon from '../../../resources/icon.png?asset'
import { getBg, getLocalServer, getMainWindow, setIsQuitting } from '../stores/appStore'

export function initTray(): Tray {
	const tray = new Tray(icon)
	tray.setToolTip('Hey Ketsu')

	const contextMenu = Menu.buildFromTemplate([
		{
			label: 'Show App',
			click: () => {
				getMainWindow()?.show()
			}
		},
		{
			label: 'Open in Browser',
			click: () => {
				const localServer = getLocalServer()
				if (localServer?.isServerRunning()) {
					shell.openExternal(localServer.getAppUrl())
				}
			}
		},
		{ type: 'separator' },
		{
			label: 'Quit',
			click: () => {
				console.log('Tray quit clicked - starting cleanup...')
				setIsQuitting(true)
				getBg()?.cleanup()
				getLocalServer()?.stop()

				// Force quit after cleanup
				setTimeout(() => {
					console.log('Force quitting from tray...')
					app.exit(0)
				}, 1000)
			}
		}
	])

	tray.setContextMenu(contextMenu)

	// Double click tray icon to show window
	tray.on('double-click', () => {
		getMainWindow()?.show()
	})

	return tray
}
