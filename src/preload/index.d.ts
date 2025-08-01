import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getServerUrl: () => Promise<string>
      isServerRunning: () => Promise<boolean>
      reloadBackground: (monitorId: number) => Promise<void>
      reloadAllBackgrounds: () => Promise<void>
      makeBackgroundInteractive: (monitorId: number) => Promise<void>
      makeAllBackgroundsInteractive: () => Promise<void>
      makeBackgroundNonInteractive: (monitorId: number) => Promise<void>
      makeAllBackgroundsNonInteractive: () => Promise<void>
    }
  }
}
