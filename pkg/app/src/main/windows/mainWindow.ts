import { is } from '@electron-toolkit/utils'
import { BrowserWindow, screen, shell } from 'electron'
import { autoUpdater } from 'electron-updater'
import { join } from 'path'
import icon from '../../../resources/icon.png?asset'
import { appConfig } from '../config'

// Store reference to main window
let window: BrowserWindow | null = null

// Track if the app is actually quitting
let isQuitting = false

export function createWindow(): void {
	const transparent = appConfig.window.transparent
	console.log('Creating window with transparent:', transparent)

	// Create the browser window.
	window = new BrowserWindow({
		width: 600,
		height: 1120,
		show: false,
		autoHideMenuBar: true,
		resizable: true,
		frame: !transparent,
		transparent: transparent,
		backgroundColor: '#00000000',
		roundedCorners: true,
		hasShadow: !transparent,
		titleBarStyle: transparent ? 'hidden' : 'default',
		titleBarOverlay: false,
		title: transparent ? '' : 'Hey',
		skipTaskbar: !transparent,
		thickFrame: !transparent,
		minimizable: true,
		maximizable: true,
		closable: true,
		minWidth: 600,
		...(process.platform === 'linux' ? { icon } : {}),
		webPreferences: {
			preload: join(__dirname, '../preload/index.js'),
			sandbox: false,
			webSecurity: false,
			allowRunningInsecureContent: true,
			contextIsolation: true,
			nodeIntegration: false,
			webviewTag: true,
			plugins: true
		}
	})

	window.on('resize', () => {
		//console.log('Window resized', window?.getBounds())
	})

	window.on('ready-to-show', () => {
		window?.show()
	})

	window.once('ready-to-show', () => {
		if (!window) return
		//snapToRight()
		window.show()
	})

	// Check for updates when window is shown
	window.on('show', () => {
		if (!is.dev) {
			console.log('Window shown - checking for updates...')
			autoUpdater.checkForUpdates()
		}
	})

	window.webContents.setWindowOpenHandler((details) => {
		shell.openExternal(details.url)
		return { action: 'deny' }
	})

	// Close to tray behavior
	window.on('close', (event) => {
		if (!isQuitting) {
			event.preventDefault()
			window?.hide()
		}
	})

	// Hide window when it loses focus
	window.on('blur', () => {
		if (!isQuitting && window && !window.isDestroyed()) {
			ensureTitleBarIsHidden()
		}
	})

	// HMR for renderer base on electron-vite cli.
	// Load the remote URL for development or the local html file for production.
	if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
		window.loadURL(process.env['ELECTRON_RENDERER_URL'])
	} else {
		window.loadFile(join(__dirname, '../renderer/index.html'))
	}
}

let delta = 1

// Dirty tricky to prevent the titlebar of a transparent window from appearing when window loose focus
// Title bar is still visible for a fraction of a second
function ensureTitleBarIsHidden(): void {
	if (!appConfig.window.transparent) return
	setTimeout(() => {
		delta *= -1
		if (window && !window.isDestroyed()) {
			// Resizing the window reapply the titlebar style
			const { x, y, width: winW, height: winH } = window.getBounds()
			window?.setBounds({
				x: x,
				y: y,
				width: winW,
				height: winH + delta
			})
		}
	}, 1)
}

// @ts-ignore
function snapToRight() {
	if (!window) return
	const { width: winW, height: winH } = window.getBounds()
	const { workArea } = screen.getPrimaryDisplay() // respects taskbar/dock
	const x = workArea.x + workArea.width - winW - 10 // align to the right
	const y = workArea.y + (workArea.height - winH) / 2 // center vertically
	window.setBounds({
		x: x,
		y: y,
		width: winW,
		height: winH
	})
	window.setPosition(x, y)
}

function getMainWindow(): BrowserWindow | null {
	return window
}

function setIsQuitting(quitting: boolean): void {
	isQuitting = quitting
}

export function getIsQuitting(): boolean {
	return isQuitting
}

function showMainWindow(): void {
	if (window && !window.isDestroyed()) {
		window.show()
		window.focus()
	} else {
		// If main window is destroyed, create a new one
		createWindow()
	}
}

function hideMainWindow(): void {
	if (window && !window.isDestroyed()) {
		window.hide()
	}
}

function toggleMainWindow(): void {
	if (window && !window.isDestroyed()) {
		window.isVisible() ? hideMainWindow() : showMainWindow()
	}
}

export function recreateMainWindow(): void {
	window?.destroy()
	createWindow()
}

export const mainWindow = {
	show: showMainWindow,
	hide: hideMainWindow,
	toggle: toggleMainWindow,
	get: getMainWindow,
	setIsQuitting: (quitting: boolean) => setIsQuitting(quitting),
	recreate: recreateMainWindow
}

export type MainWindow = typeof mainWindow
