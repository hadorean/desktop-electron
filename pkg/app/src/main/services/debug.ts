import { debugVisible } from '$shared/stores/debugStore'
import { IpcEvents, RendererEvents } from '$shared/types/ipc'
import { SocketEvents } from '$shared/types/sockets'
import { app } from 'electron'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { LocalServer } from '../server'
import { appStore } from '../stores/appStore'
import type { MainWindow } from '../windows/mainWindow'

let localServer: LocalServer | null = null
let mainWindow: MainWindow | null = null

export function setupDebug(): void {
	initializeStore()
	observeStore()
	appStore.subscribe((app) => {
		if (app) {
			localServer = app.localServer
			mainWindow = app.mainWindow
		}
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
			debugVisible.set(savedVisible)
		}
	} catch (error) {
		console.error('Error loading debug state from file:', error)
	}
}

// Observe store changes and handle persistence + broadcasting
function observeStore(): void {
	debugVisible.subscribe((visible) => {
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
	if (mainWindow) {
		const win = mainWindow.get()
		win?.webContents.send(event, data)
	}
}

function broadcastState(visible: boolean): void {
	try {
		// Broadcast to socket clients
		localServer?.emit(SocketEvents.DebugStateChanged, { visible, timestamp: Date.now() })
		// Send to main window renderer via IPC
		sendToRenderer(IpcEvents.DebugStateChanged, visible)
	} catch (error) {
		console.error('Error broadcasting debug state:', error)
	}
}
