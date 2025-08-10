export const SocketEvents = {
	SettingsUpdate: 'settings_update',
	DebugStateChanged: 'debug_state_changed',
	UpdateSettings: 'update_settings',
	SettingsUpdated: 'settings_updated'
} as const;

// Type for server-to-client events (events that servers emit)
export type ServerEvents =
	| typeof SocketEvents.SettingsUpdate
	| typeof SocketEvents.DebugStateChanged
	| typeof SocketEvents.SettingsUpdated;

// Type for client-to-server events (events that clients emit)
export type ClientEvents = typeof SocketEvents.UpdateSettings;
