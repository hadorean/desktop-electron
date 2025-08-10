import { ipcMain, app } from 'electron'
import { AppContext } from './context'
import { settingsService } from './settings'

export function setupIpc(options: AppContext) {
  const { localServer, bg } = options

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // IPC handlers for server communication
  ipcMain.handle('get-server-url', () => {
    return localServer.getUrl()
  })

  ipcMain.handle('is-server-running', () => {
    return localServer.isServerRunning()
  })

  // IPC handler for app version
  ipcMain.handle('get-app-version', () => {
    return app.getVersion()
  })

  // IPC handlers for background management
  ipcMain.handle('reload-background', (_, monitorId: number) => {
    bg?.reloadBackground(monitorId)
  })

  ipcMain.handle('reload-all-backgrounds', () => {
    bg?.reloadAllBackgrounds()
  })

  // IPC handlers for background interactivity
  ipcMain.handle('make-background-interactive', (_, monitorId: number) => {
    bg?.makeInteractive(monitorId)
  })

  ipcMain.handle('make-all-backgrounds-interactive', () => {
    bg?.makeAllInteractive()
  })

  ipcMain.handle('make-background-non-interactive', (_, monitorId: number) => {
    bg?.makeNonInteractive(monitorId)
  })

  ipcMain.handle('make-all-backgrounds-non-interactive', () => {
    bg?.makeAllNonInteractive()
  })

  // IPC handlers for settings
  ipcMain.handle('settings-get', async () => {
    try {
      const settings = await settingsService.getSettings()
      return { success: true, data: settings }
    } catch (error) {
      console.error('IPC settings-get error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle('settings-update-shared', async (_, settings) => {
    try {
      const currentSettings = await settingsService.getSettings()
      const updatedSettings = {
        shared: {
          ...currentSettings.shared,
          ...settings
        }
      }
      const updateEvent = await settingsService.updateSettings(updatedSettings, 'ipc-client')
      return { success: true, data: updateEvent.settings }
    } catch (error) {
      console.error('IPC settings-update-shared error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle('settings-update-local', async (_, screenId, settings) => {
    try {
      const currentSettings = await settingsService.getSettings()
      const updatedSettings = {
        screens: {
          ...currentSettings.screens,
          [screenId]: {
            ...currentSettings.screens[screenId],
            ...settings
          }
        }
      }
      const updateEvent = await settingsService.updateSettings(updatedSettings, 'ipc-client')
      return { success: true, data: updateEvent.settings }
    } catch (error) {
      console.error('IPC settings-update-local error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle('settings-is-available', async () => {
    try {
      await settingsService.getSettings()
      return { success: true, data: true }
    } catch (error) {
      console.error('IPC settings-is-available error:', error)
      return { success: false, data: false }
    }
  })
}
