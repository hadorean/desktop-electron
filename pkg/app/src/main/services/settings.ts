import { type UserSettings } from '$shared/types'
import { DayNightMode, DefaultTransitionSettings, DefaultUserSettings } from '$shared/types/settings'
import { app } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'
import { getLocalServer } from '../stores/appStore'
import { monitorStore } from '../stores/monitorStore'

export class SettingsService {
	private settings: UserSettings | null = null
	private settingsPath: string
	private defaultSettings: UserSettings = DefaultUserSettings
	private savingTimeout: NodeJS.Timeout | null = null
	private currentTheme: DayNightMode | null = null

	static count = 0

	constructor() {
		this.settingsPath = join(app.getPath('userData'), `settings.json`)
		console.log('SettingsService constructor', SettingsService.count++)
		this.getSettings().then(settings => {
			this.updateMonitors(settings)
		})
		setInterval(() => {
			this.updateSchedule()
		}, 1000)
	}

	private updateSchedule(): void {
		if (this.settings?.shared.schedule?.enabled) {
			const now = new Date()
			const time = now.getHours() + now.getMinutes() / 60
			const dayTime = this.settings.shared.schedule.day
			const nightTime = this.settings.shared.schedule.night
			if (time >= dayTime) {
				if (time >= nightTime) {
					const theme = dayTime > nightTime ? 'day' : 'night'
					this.setCurrentTheme(theme)
				} else {
					this.setCurrentTheme('day')
				}
			} else if (time >= nightTime) {
				this.setCurrentTheme('night')
			}
		}
	}

	private setCurrentTheme(theme: DayNightMode): void {
		if (this.currentTheme == theme || this.settings == null) return
		console.log('Setting current theme to', theme)
		this.currentTheme = theme
		this.updateSettings({ currentTheme: theme })
		getLocalServer()?.emit('settings_update', {
			settings: { ...this.settings!, currentTheme: theme },
			transition: DefaultTransitionSettings
		})
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

	async updateMonitors(settings: UserSettings): Promise<void> {
		const updatedMonitors = Object.fromEntries(
			Object.entries(settings.screens).map(([key, value]) => [key, value.monitorEnabled])
		)
		monitorStore.updateMonitors(updatedMonitors)
	}

	/**
	 * Update settings and persist to file system
	 */
	async updateSettings(newSettings: Partial<UserSettings>): Promise<UserSettings> {
		const currentSettings = await this.getSettings()
		const updatedSettings = { ...currentSettings, ...newSettings }

		// Update memory
		this.settings = updatedSettings
		this.updateMonitors(updatedSettings)
		// TEMP // settingsStore.updateSettings(updatedSettings)

		// Persist to file system
		if (this.savingTimeout) {
			clearTimeout(this.savingTimeout)
		}
		this.savingTimeout = setTimeout(async () => {
			await this.saveToFileSystem(updatedSettings)
		}, 1000)

		return updatedSettings
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
