import type { SettingsUpdateEvent, ServerSettings } from './settings'

export const SocketEvents = {
	SettingsUpdate: 'settings_update',
	DebugStateChanged: 'debug_state_changed',
	ClientUpdatedSettings: 'client_updated_settings'
} as const;

// Data types for server events
export interface DebugStateChangedEvent {
	visible: boolean;
	timestamp: number;
}

// Data types for client events
export interface ClientSettingsUpdateEvent {
	settings: Partial<ServerSettings>;
	clientId: string;
}

// Type mapping for server events and their data
export interface ServerEventMap {
	[SocketEvents.SettingsUpdate]: SettingsUpdateEvent;
	[SocketEvents.DebugStateChanged]: DebugStateChangedEvent;
}

// Type mapping for client events and their data
export interface ClientEventMap {
	[SocketEvents.ClientUpdatedSettings]: ClientSettingsUpdateEvent;
}

// Type for server-to-client events (events that servers emit)
export type ServerEvents =
	| typeof SocketEvents.SettingsUpdate
	| typeof SocketEvents.DebugStateChanged;

// Type for client-to-server events (events that clients emit)
export type ClientEvents = typeof SocketEvents.ClientUpdatedSettings;
