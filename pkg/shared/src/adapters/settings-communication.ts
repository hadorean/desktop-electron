/**
 * Settings communication adapter interface
 * Provides abstraction for different communication methods (HTTP API vs IPC)
 */

import type { UISettings, ServerSettings } from '../types/settings'

/**
 * Interface for settings communication adapters
 */
export interface SettingsAdapter {
	/**
	 * Update shared settings that apply to all screens
	 */
	updateSharedSettings(settings: Partial<UISettings>): Promise<void>

	/**
	 * Update local settings for a specific screen
	 */
	updateLocalSettings(screenId: string, settings: Partial<UISettings>): Promise<void>

	/**
	 * Get all settings (shared + all screens)
	 */
	getSettings(): Promise<ServerSettings>

	/**
	 * Subscribe to settings changes
	 * @returns unsubscribe function
	 */
	subscribeToChanges(callback: (settings: ServerSettings) => void): () => void

	/**
	 * Check if the adapter is available/connected
	 */
	isAvailable(): Promise<boolean>
}

/**
 * Settings adapter update event types
 */
export interface SettingsAdapterEvent {
	type: 'shared' | 'local'
	screenId?: string
	settings: Partial<UISettings>
}

/**
 * Base adapter class with common functionality
 */
export abstract class BaseSettingsAdapter implements SettingsAdapter {
	protected listeners: ((settings: ServerSettings) => void)[] = []

	abstract updateSharedSettings(settings: Partial<UISettings>): Promise<void>
	abstract updateLocalSettings(screenId: string, settings: Partial<UISettings>): Promise<void>
	abstract getSettings(): Promise<ServerSettings>
	abstract isAvailable(): Promise<boolean>

	/**
	 * Subscribe to settings changes
	 */
	subscribeToChanges(callback: (settings: ServerSettings) => void): () => void {
		this.listeners.push(callback)
		
		// Return unsubscribe function
		return () => {
			const index = this.listeners.indexOf(callback)
			if (index > -1) {
				this.listeners.splice(index, 1)
			}
		}
	}

	/**
	 * Notify all listeners of settings changes
	 */
	protected notifyListeners(settings: ServerSettings): void {
		this.listeners.forEach(callback => callback(settings))
	}
}