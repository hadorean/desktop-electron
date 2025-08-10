export const SocketEvents = {
	SettingsUpdate: 'settings_update',
	DebugStateChanged: 'debug_state_changed',
	ClientUpdatedSettings: 'client_updated_settings'
} as const;

// Type for server-to-client events (events that servers emit)
export type ServerEvents =
	| typeof SocketEvents.SettingsUpdate
	| typeof SocketEvents.DebugStateChanged;

// Type for client-to-server events (events that clients emit)
export type ClientEvents = typeof SocketEvents.ClientUpdatedSettings;
