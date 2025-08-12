import type { AppConfig, ScreenSettings, UserSettings } from '$shared/types/settings'
import { ElectronAPI } from '@electron-toolkit/preload'
import type { ProgressInfo, UpdateInfo } from 'electron-updater'

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
			getSettings: () => Promise<{ success: boolean; data?: UserSettings; error?: string }>
			updateSharedSettings: (settings: Partial<ScreenSettings>) => Promise<{ success: boolean; data?: UserSettings; error?: string }>
			updateLocalSettings: (screenId: string, settings: Partial<ScreenSettings>) => Promise<{ success: boolean; data?: UserSettings; error?: string }>
			isSettingsAvailable: () => Promise<{ success: boolean; data: boolean }>
			// Debug menu APIs
			getDebugState: () => Promise<{ success: boolean; visible?: boolean; error?: string }>
			onDebugStateChanged: (callback: (visible: boolean) => void) => void
			// Window control APIs
			minimizeWindow: () => Promise<void>
			maximizeWindow: () => Promise<void>
			closeWindow: () => Promise<void>
			// Window configuration API
			getWindowConfig: () => Promise<AppConfig>
			recreateMainWindow: () => Promise<void>
		}
	}
}
