import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { VersionInfo } from '@heyketsu/shared/types'
import { IpcEvents } from '@heyketsu/shared/types/ipc'

// Custom APIs for renderer
const api = {
  getServerUrl: () => ipcRenderer.invoke(IpcEvents.GetServerUrl),
  isServerRunning: () => ipcRenderer.invoke(IpcEvents.IsServerRunning),
  getAppVersion: () => ipcRenderer.invoke(IpcEvents.GetAppVersion),
  reloadBackground: (monitorId: number) => ipcRenderer.invoke(IpcEvents.ReloadBackground, monitorId),
  reloadAllBackgrounds: () => ipcRenderer.invoke(IpcEvents.ReloadAllBackgrounds),
  makeBackgroundInteractive: (monitorId: number) => ipcRenderer.invoke(IpcEvents.MakeBackgroundInteractive, monitorId),
  makeAllBackgroundsInteractive: () => ipcRenderer.invoke(IpcEvents.MakeAllBackgroundsInteractive),
  makeBackgroundNonInteractive: (monitorId: number) => ipcRenderer.invoke(IpcEvents.MakeBackgroundNonInteractive, monitorId),
  makeAllBackgroundsNonInteractive: () => ipcRenderer.invoke(IpcEvents.MakeAllBackgroundsNonInteractive),
  // Auto-update APIs
  checkForUpdates: () => ipcRenderer.invoke(IpcEvents.CheckForUpdates),
  downloadUpdate: () => ipcRenderer.invoke(IpcEvents.DownloadUpdate),
  installUpdate: () => ipcRenderer.invoke(IpcEvents.InstallUpdate),
  // Auto-update event listeners
  onUpdateAvailable: (callback: (info: VersionInfo) => void) => {
    ipcRenderer.on(IpcEvents.UpdateAvailable, (_, info) => callback(info))
  },
  onUpdateDownloadProgress: (callback: (progressObj: any) => void) => {
    ipcRenderer.on(IpcEvents.UpdateDownloadProgress, (_, progressObj) => callback(progressObj))
  },
  onUpdateDownloaded: (callback: (info: any) => void) => {
    ipcRenderer.on(IpcEvents.UpdateDownloaded, (_, info) => callback(info))
  },
  // Settings APIs
  getSettings: () => ipcRenderer.invoke(IpcEvents.SettingsGet),
  updateSharedSettings: (settings: any) => ipcRenderer.invoke(IpcEvents.SettingsUpdateShared, settings),
  updateLocalSettings: (screenId: string, settings: any) => ipcRenderer.invoke(IpcEvents.SettingsUpdateLocal, screenId, settings),
  isSettingsAvailable: () => ipcRenderer.invoke(IpcEvents.SettingsIsAvailable),
  // Debug menu API
  getDebugState: () => ipcRenderer.invoke(IpcEvents.GetDebugState),
  onDebugStateChanged: (callback: (visible: boolean) => void) => {
    ipcRenderer.on(IpcEvents.DebugStateChanged, (_, visible) => callback(visible))
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
