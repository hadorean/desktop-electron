import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { VersionInfo } from '@heyketsu/shared'

// Custom APIs for renderer
const api = {
  getServerUrl: () => ipcRenderer.invoke('get-server-url'),
  isServerRunning: () => ipcRenderer.invoke('is-server-running'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  reloadBackground: (monitorId: number) => ipcRenderer.invoke('reload-background', monitorId),
  reloadAllBackgrounds: () => ipcRenderer.invoke('reload-all-backgrounds'),
  makeBackgroundInteractive: (monitorId: number) =>
    ipcRenderer.invoke('make-background-interactive', monitorId),
  makeAllBackgroundsInteractive: () => ipcRenderer.invoke('make-all-backgrounds-interactive'),
  makeBackgroundNonInteractive: (monitorId: number) =>
    ipcRenderer.invoke('make-background-non-interactive', monitorId),
  makeAllBackgroundsNonInteractive: () =>
    ipcRenderer.invoke('make-all-backgrounds-non-interactive'),
  // Auto-update APIs
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  // Auto-update event listeners
  onUpdateAvailable: (callback: (info: VersionInfo) => void) => {
    ipcRenderer.on('update-available', (_, info) => callback(info))
  },
  onUpdateDownloadProgress: (callback: (progressObj: any) => void) => {
    ipcRenderer.on('update-download-progress', (_, progressObj) => callback(progressObj))
  },
  onUpdateDownloaded: (callback: (info: any) => void) => {
    ipcRenderer.on('update-downloaded', (_, info) => callback(info))
  },
  // Settings APIs
  getSettings: () => ipcRenderer.invoke('settings-get'),
  updateSharedSettings: (settings: any) => ipcRenderer.invoke('settings-update-shared', settings),
  updateLocalSettings: (screenId: string, settings: any) => ipcRenderer.invoke('settings-update-local', screenId, settings),
  isSettingsAvailable: () => ipcRenderer.invoke('settings-is-available')
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
