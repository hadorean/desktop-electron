/**
 * IPC-based settings adapter for Electron app renderer processes
 * Uses Electron IPC to communicate with the main process
 */

import type { UISettings, ServerSettings } from '../types/settings'
import { BaseSettingsAdapter } from './settings-communication'

/**
 * IPC API response format
 */
interface IpcResponse<T = any> {
	success: boolean
	data?: T
	error?: string
}

export class IpcSettingsAdapter extends BaseSettingsAdapter {
	private api: any

	constructor() {
		super()
		
		// In Electron renderer, the IPC API should be available via window.api
		if (typeof window !== 'undefined' && (window as any).api) {
			this.api = (window as any).api
		} else {
			throw new Error('IPC Settings Adapter requires window.api to be available (Electron renderer context)')
		}
	}

	/**
	 * Handle IPC response and throw error if needed
	 */
	private handleIpcResponse<T>(response: IpcResponse<T>): T {
		if (!response.success) {
			throw new Error(response.error || 'IPC request failed')
		}
		return response.data as T
	}

	/**
	 * Update shared settings via IPC
	 */
	async updateSharedSettings(settings: Partial<UISettings>): Promise<void> {
		const response: IpcResponse<ServerSettings> = await this.api.updateSharedSettings(settings)
		this.handleIpcResponse(response)

		// Notify listeners with updated settings
		const newSettings = await this.getSettings()
		this.notifyListeners(newSettings)
	}

	/**
	 * Update local settings for a specific screen via IPC
	 */
	async updateLocalSettings(screenId: string, settings: Partial<UISettings>): Promise<void> {
		const response: IpcResponse<ServerSettings> = await this.api.updateLocalSettings(screenId, settings)
		this.handleIpcResponse(response)

		// Notify listeners with updated settings
		const newSettings = await this.getSettings()
		this.notifyListeners(newSettings)
	}

	/**
	 * Get all settings via IPC
	 */
	async getSettings(): Promise<ServerSettings> {
		const response: IpcResponse<ServerSettings> = await this.api.getSettings()
		return this.handleIpcResponse(response)
	}

	/**
	 * Subscribe to settings changes
	 * Note: For now, this uses the base implementation (manual refresh after updates)
	 * Future improvement: Could use IPC events for real-time updates
	 */
	subscribeToChanges(callback: (settings: ServerSettings) => void): () => void {
		// Add to parent listeners
		const unsubscribe = super.subscribeToChanges(callback)

		// TODO: Implement IPC event listening for real-time updates
		// For example: this.api.onSettingsChanged?.((settings) => callback(settings))

		return unsubscribe
	}

	/**
	 * Check if IPC settings API is available
	 */
	async isAvailable(): Promise<boolean> {
		try {
			if (!this.api || !this.api.isSettingsAvailable) {
				return false
			}
			
			const response: IpcResponse<boolean> = await this.api.isSettingsAvailable()
			return this.handleIpcResponse(response)
		} catch (error) {
			console.warn('IPC Settings API not available:', error)
			return false
		}
	}
}

/**
 * Factory function to create IPC adapter if available
 */
export function createIpcAdapterIfAvailable(): IpcSettingsAdapter | null {
	try {
		return new IpcSettingsAdapter()
	} catch (error) {
		console.warn('Cannot create IPC Settings Adapter:', error)
		return null
	}
}