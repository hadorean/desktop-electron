import type { SettingsUpdateEvent, UserSettings } from '$shared/types'
import { DefaultUserSettings } from '$shared/types/settings'
import { app } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'

export class SettingsService {
	private settings: UserSettings | null = null
	private settingsPath: string
	private defaultSettings: UserSettings = DefaultUserSettings

	static count = 0

	constructor() {
		this.settingsPath = join(app.getPath('userData'), `settings.json`)
		console.log('SettingsService constructor', SettingsService.count++)
	}

	/**
	 * Get current settings from memory, loading from file if not cached
	 */
	async getSettings(): Promise<UserSettings> {
		if (this.settings === null) {
			this.settings = await this.loadFromFileSystem()
		}
		return this.settings || this.defaultSettings
	}

	/**
	 * Update settings and persist to file system
	 */
	async updateSettings(newSettings: Partial<UserSettings>, clientId: string): Promise<SettingsUpdateEvent> {
		const currentSettings = await this.getSettings()
		const updatedSettings = { ...currentSettings, ...newSettings }

		// Update memory
		this.settings = updatedSettings

		// Persist to file system
		await this.saveToFileSystem(updatedSettings)

		return {
			type: 'settings_update',
			settings: updatedSettings,
			timestamp: Date.now(),
			clientId
		}
	}

	/**
	 * Load settings from file system
	 */
	private async loadFromFileSystem(): Promise<UserSettings> {
		try {
			const settingsData = await fs.readFile(this.settingsPath, 'utf-8')
			const parsedSettings = JSON.parse(settingsData)

			// Merge with defaults to ensure all required properties exist
			const settings = { ...this.defaultSettings, ...parsedSettings }
			console.log('Settings loaded from file system:', this.settingsPath)
			return settings
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				console.log('Settings file not found, using defaults')
				const settings = this.defaultSettings
				await this.saveToFileSystem(settings)
				return settings
			} else {
				console.error('Error loading settings:', error)
				return this.defaultSettings
			}
		}
	}

	/**
	 * Save current settings to file system
	 */
	private async saveToFileSystem(settings: UserSettings): Promise<void> {
		try {
			const settingsJson = JSON.stringify(settings, null, 2)
			await fs.writeFile(this.settingsPath, settingsJson, 'utf-8')
			console.log('Settings saved to file system:', this.settingsPath)
		} catch (error) {
			console.error('Error saving settings:', error)
			throw error
		}
	}

	/**
	 * Reset settings to defaults
	 */
	async resetSettings(): Promise<UserSettings> {
		this.settings = { ...this.defaultSettings }
		await this.saveToFileSystem(this.settings)
		return this.settings
	}

	/**
	 * Get settings file path for debugging
	 */
	getSettingsPath(): string {
		return this.settingsPath
	}
}

export const settingsService = new SettingsService()
