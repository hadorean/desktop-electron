import { ElectronAPI } from '@electron-toolkit/preload'
import type { ServerSettings, UISettings } from '@heyketsu/shared/types/settings'
import type { UpdateInfo, ProgressInfo } from 'electron-updater'

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
			onUpdateAvailable: (callback: (info: UpdateInfo) => void) => void
			onUpdateDownloadProgress: (callback: (progressObj: ProgressInfo) => void) => void
			onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => void
			// Settings APIs
			getSettings: () => Promise<{ success: boolean; data?: ServerSettings; error?: string }>
			updateSharedSettings: (settings: Partial<UISettings>) => Promise<{ success: boolean; data?: ServerSettings; error?: string }>
			updateLocalSettings: (screenId: string, settings: Partial<UISettings>) => Promise<{ success: boolean; data?: ServerSettings; error?: string }>
			isSettingsAvailable: () => Promise<{ success: boolean; data: boolean }>
			// Debug menu APIs
			getDebugState: () => Promise<{ success: boolean; visible?: boolean; error?: string }>
			onDebugStateChanged: (callback: (visible: boolean) => void) => void
		}
	}
}
