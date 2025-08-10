import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getServerUrl: () => Promise<string>
      isServerRunning: () => Promise<boolean>
      getAppVersion: () => Promise<string>
      reloadBackground: (monitorId: number) => Promise<void>
      reloadAllBackgrounds: () => Promise<void>
      makeBackgroundInteractive: (monitorId: number) => Promise<void>
      makeAllBackgroundsInteractive: () => Promise<void>
      makeBackgroundNonInteractive: (monitorId: number) => Promise<void>
      makeAllBackgroundsNonInteractive: () => Promise<void>
      // Auto-update APIs
      checkForUpdates: () => Promise<void>
      downloadUpdate: () => Promise<void>
      installUpdate: () => Promise<void>
      onUpdateAvailable: (callback: (info: any) => void) => void
      onUpdateDownloadProgress: (callback: (progressObj: any) => void) => void
      onUpdateDownloaded: (callback: (info: any) => void) => void
      // Settings APIs
      getSettings: () => Promise<any>
      updateSharedSettings: (settings: any) => Promise<any>
      updateLocalSettings: (screenId: string, settings: any) => Promise<any>
      isSettingsAvailable: () => Promise<any>
      // Debug menu APIs
      getDebugState: () => Promise<any>
      onDebugStateChanged: (callback: (visible: boolean) => void) => void
    }
  }
}
