import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getServerUrl: () => ipcRenderer.invoke('get-server-url'),
  isServerRunning: () => ipcRenderer.invoke('is-server-running'),
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
  onUpdateAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('update-available', (_, info) => callback(info))
  },
  onUpdateDownloadProgress: (callback: (progressObj: any) => void) => {
    ipcRenderer.on('update-download-progress', (_, progressObj) => callback(progressObj))
  },
  onUpdateDownloaded: (callback: (info: any) => void) => {
    ipcRenderer.on('update-downloaded', (_, info) => callback(info))
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
