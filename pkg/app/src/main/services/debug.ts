import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { debugVisible } from '@heyketsu/shared/stores/debugStore'
import { SocketEvents } from '@heyketsu/shared/types/sockets'
import { IpcEvents, RendererEvents } from '@heyketsu/shared/types/ipc'
import type { LocalServer } from '../server'
import type { MainWindow } from '../windows/mainWindow'

// Get the path for storing debug state
function getDebugStatePath(): string {
  return join(app.getPath('userData'), 'debug-state.json')
}

// Debug state manager class
class DebugService {
  private localServer?: LocalServer
  private mainWindow?: MainWindow

  constructor() {
    this.initializeStore()
    this.observeStore()
  }

  // Initialize the store with saved state from file
  private initializeStore(): void {
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
  private observeStore(): void {
    debugVisible.subscribe((visible) => {
      // Save to file
      this.saveToFile(visible)

      // Broadcast to clients
      this.broadcastState(visible)
    })
  }

  private saveToFile(visible: boolean): void {
    try {
      const statePath = getDebugStatePath()
      writeFileSync(statePath, JSON.stringify({ visible }))
    } catch (error) {
      console.error('Error saving debug state to file:', error)
    }
  }

  private sendToRenderer(event: RendererEvents, data: unknown): void {
    if (this.mainWindow) {
      const win = this.mainWindow.get()
      if (win) {
        win.webContents.send(event, data)
      }
    }
  }

  private broadcastState(visible: boolean): void {
    try {
      // Broadcast to socket clients
      if (this.localServer) {
        this.localServer.emit(SocketEvents.DebugStateChanged, { visible, timestamp: Date.now() })
      }

      // Send to main window renderer via IPC
      this.sendToRenderer(IpcEvents.DebugStateChanged, visible)
    } catch (error) {
      console.error('Error broadcasting debug state:', error)
    }
  }

  // Set dependencies for broadcasting
  public setDependencies(localServer: LocalServer, mainWindow: MainWindow): void {
    this.localServer = localServer
    this.mainWindow = mainWindow
  }
}

// Export singleton instance
export const debugService = new DebugService()
