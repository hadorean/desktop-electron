export const IpcEvents = {
	// Test/Debug
	Ping: 'ping',

	// Server
	GetServerUrl: 'get-server-url',
	IsServerRunning: 'is-server-running',

	// App Info
	GetAppVersion: 'get-app-version',

	// Background Management
	ReloadBackground: 'reload-background',
	ReloadAllBackgrounds: 'reload-all-backgrounds',
	MakeBackgroundInteractive: 'make-background-interactive',
	MakeAllBackgroundsInteractive: 'make-all-backgrounds-interactive',
	MakeBackgroundNonInteractive: 'make-background-non-interactive',
	MakeAllBackgroundsNonInteractive: 'make-all-backgrounds-non-interactive',

	// Settings
	SettingsGet: 'settings-get',
	SettingsUpdateShared: 'settings-update-shared',
	SettingsUpdateLocal: 'settings-update-local',
	SettingsIsAvailable: 'settings-is-available',

	// Debug
	GetDebugState: 'get-debug-state',
	DebugStateChanged: 'debug-state-changed',

	// Auto-update (main → renderer)
	UpdateAvailable: 'update-available',
	UpdateDownloadProgress: 'update-download-progress',
	UpdateDownloaded: 'update-downloaded',

	// Auto-update (renderer → main)
	CheckForUpdates: 'check-for-updates',
	DownloadUpdate: 'download-update',
	InstallUpdate: 'install-update'
} as const

// Type for main process events (handled by ipcMain)
export type MainEvents =
	| typeof IpcEvents.Ping
	| typeof IpcEvents.GetServerUrl
	| typeof IpcEvents.IsServerRunning
	| typeof IpcEvents.GetAppVersion
	| typeof IpcEvents.ReloadBackground
	| typeof IpcEvents.ReloadAllBackgrounds
	| typeof IpcEvents.MakeBackgroundInteractive
	| typeof IpcEvents.MakeAllBackgroundsInteractive
	| typeof IpcEvents.MakeBackgroundNonInteractive
	| typeof IpcEvents.MakeAllBackgroundsNonInteractive
	| typeof IpcEvents.SettingsGet
	| typeof IpcEvents.SettingsUpdateShared
	| typeof IpcEvents.SettingsUpdateLocal
	| typeof IpcEvents.SettingsIsAvailable
	| typeof IpcEvents.GetDebugState
	| typeof IpcEvents.CheckForUpdates
	| typeof IpcEvents.DownloadUpdate
	| typeof IpcEvents.InstallUpdate

// Type for renderer process events (sent from main to renderer)
export type RendererEvents =
	| typeof IpcEvents.UpdateAvailable
	| typeof IpcEvents.UpdateDownloadProgress
	| typeof IpcEvents.UpdateDownloaded
	| typeof IpcEvents.DebugStateChanged
