import { debugMenu } from '$shared/stores/debugStore'
import { IpcEvents, RendererEvents } from '$shared/types/ipc'
import { app } from 'electron'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { LocalServer } from '../server'
import { localServer as localServerStore, mainWindow as mainWindowStore } from '../stores/appStore'
import { MainWindow } from '../windows/mainWindow'

let localServer: LocalServer | null = null
let mainWindow: MainWindow | null = null

export function initDebug(): void {
	initializeStore()
	observeStore()
	localServerStore.subscribe(server => {
		if (app) {
			localServer = server
		}
	})
	mainWindowStore.subscribe(window => {
		mainWindow = window
	})
}

// Get the path for storing debug state
function getDebugStatePath(): string {
	return join(app.getPath('userData'), 'debug-state.json')
}

// Initialize the store with saved state from file
function initializeStore(): void {
	try {
		const statePath = getDebugStatePath()
		if (existsSync(statePath)) {
			const data = readFileSync(statePath, 'utf8')
			const state = JSON.parse(data)
			const savedVisible = state.visible ?? true
			debugMenu.setVisible(savedVisible)
		}
	} catch (error) {
		console.error('Error loading debug state from file:', error)
	}
}

// Observe store changes and handle persistence + broadcasting
function observeStore(): void {
	debugMenu.visibility.subscribe(visible => {
		saveToFile(visible)
		broadcastState(visible)
	})
}

function saveToFile(visible: boolean): void {
	try {
		const statePath = getDebugStatePath()
		writeFileSync(statePath, JSON.stringify({ visible }))
	} catch (error) {
		console.error('Error saving debug state to file:', error)
	}
}

function sendToRenderer(event: RendererEvents, data: unknown): void {
	const win = mainWindow?.get()
	win?.webContents.send(event, data)
}

function broadcastState(visible: boolean): void {
	try {
		// Broadcast to socket clients
		localServer?.emit('debug_state_changed', { visible })
		// Send to main window renderer via IPC
		sendToRenderer(IpcEvents.DebugStateChanged, visible)
	} catch (error) {
		console.error('Error broadcasting debug state:', error)
	}
}
