import { ipcMain, app } from 'electron'
import { AppContext } from './context'
import { settingsService } from './settings'
import { getDebugMenuVisible } from '@heyketsu/shared/stores/debugStore'
import { IpcEvents, MainEvents } from '@heyketsu/shared/types/ipc'

export function setupIpc(options: AppContext): void {
  const { localServer, bg } = options

  // Type-safe wrappers for IPC
  const handleIpc = (event: MainEvents, handler: (...args: unknown[]) => unknown): void => {
    ipcMain.handle(event, handler)
  }

  const onIpc = (event: MainEvents, handler: (...args: unknown[]) => void): void => {
    ipcMain.on(event, handler)
  }

  // IPC test
  onIpc(IpcEvents.Ping, () => console.log('pong'))

  // IPC handlers for server communication
  handleIpc(IpcEvents.GetServerUrl, () => {
    return localServer.getUrl()
  })

  handleIpc(IpcEvents.IsServerRunning, () => {
    return localServer.isServerRunning()
  })

  // IPC handler for app version
  handleIpc(IpcEvents.GetAppVersion, () => {
    return app.getVersion()
  })

  // IPC handlers for background management
  handleIpc(IpcEvents.ReloadBackground, (_, monitorId: number) => {
    bg?.reloadBackground(monitorId)
  })

  handleIpc(IpcEvents.ReloadAllBackgrounds, () => {
    bg?.reloadAllBackgrounds()
  })

  // IPC handlers for background interactivity
  handleIpc(IpcEvents.MakeBackgroundInteractive, (_, monitorId: number) => {
    bg?.makeInteractive(monitorId)
  })

  handleIpc(IpcEvents.MakeAllBackgroundsInteractive, () => {
    bg?.makeAllInteractive()
  })

  handleIpc(IpcEvents.MakeBackgroundNonInteractive, (_, monitorId: number) => {
    bg?.makeNonInteractive(monitorId)
  })

  handleIpc(IpcEvents.MakeAllBackgroundsNonInteractive, () => {
    bg?.makeAllNonInteractive()
  })

  // IPC handlers for settings
  handleIpc(IpcEvents.SettingsGet, async () => {
    try {
      const settings = await settingsService.getSettings()
      return { success: true, data: settings }
    } catch (error) {
      console.error('IPC settings-get error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  handleIpc(IpcEvents.SettingsUpdateShared, async (_, settings) => {
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

  handleIpc(IpcEvents.SettingsUpdateLocal, async (_, screenId, settings) => {
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

  handleIpc(IpcEvents.SettingsIsAvailable, async () => {
    try {
      await settingsService.getSettings()
      return { success: true, data: true }
    } catch (error) {
      console.error('IPC settings-is-available error:', error)
      return { success: false, data: false }
    }
  })

  // IPC handler to get current debug state
  handleIpc(IpcEvents.GetDebugState, () => {
    try {
      return { success: true, visible: getDebugMenuVisible() }
    } catch (error) {
      console.error('IPC get-debug-state error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}
