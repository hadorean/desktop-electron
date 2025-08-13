import type { UserOptions, UserOptionsUpdateEvent } from '$shared/types'
import { DefaultUserOptions } from '$shared/types/user-options'
import { loadUserOptions, shouldPreventUserOptionsSync, userOptions, getCurrentUserOptions } from '$shared/stores/userOptionsStore'
import { app } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'

export class UserOptionsService {
	private optionsPath: string
	private defaultOptions: UserOptions = DefaultUserOptions
	private hasInitialized = false

	constructor() {
		this.optionsPath = join(app.getPath('userData'), 'user-options.json')
	}

	/**
	 * Initialize the service - load from file and setup store subscription
	 */
	async initialize(): Promise<void> {
		if (this.hasInitialized) return

		// Load options from file system
		await this.loadFromFileSystem()

		// Subscribe to store changes for automatic persistence
		userOptions.subscribe((options) => {
			// Skip persistence during initial load and internal operations
			if (!shouldPreventUserOptionsSync() && this.hasInitialized) {
				this.saveToFileSystem(options).catch((error) => {
					console.error('Failed to save user options:', error)
				})
			}
		})

		this.hasInitialized = true
		console.log('🔧 UserOptionsService initialized')
	}

	/**
	 * Get current options
	 */
	getCurrentOptions(): UserOptions {
		return getCurrentUserOptions()
	}

	/**
	 * Update options and persist to file system
	 */
	async updateOptions(newOptions: Partial<UserOptions>, clientId: string): Promise<UserOptionsUpdateEvent> {
		const currentOptions = getCurrentUserOptions()
		const updatedOptions = { ...currentOptions, ...newOptions }

		// Update store (this will trigger auto-save via subscription)
		loadUserOptions(updatedOptions)

		return {
			type: 'user_options_update',
			options: updatedOptions,
			timestamp: Date.now(),
			clientId
		}
	}

	/**
	 * Load options from file system
	 */
	private async loadFromFileSystem(): Promise<void> {
		try {
			const optionsData = await fs.readFile(this.optionsPath, 'utf-8')
			const parsedOptions = JSON.parse(optionsData)

			// Merge with defaults to ensure all required properties exist
			const options = { ...this.defaultOptions, ...parsedOptions }

			// Load into store
			loadUserOptions(options)

			console.log('🔧 User options loaded from file system:', this.optionsPath)
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				console.log('🔧 User options file not found, using defaults')
				loadUserOptions(this.defaultOptions)
				await this.saveToFileSystem(this.defaultOptions)
			} else {
				console.error('Error loading user options:', error)
				loadUserOptions(this.defaultOptions)
			}
		}
	}

	/**
	 * Save current options to file system
	 */
	private async saveToFileSystem(options: UserOptions): Promise<void> {
		try {
			const optionsJson = JSON.stringify(options, null, 2)
			await fs.writeFile(this.optionsPath, optionsJson, 'utf-8')
			console.log('🔧 User options saved to file system:', this.optionsPath)
		} catch (error) {
			console.error('Error saving user options:', error)
			throw error
		}
	}

	/**
	 * Reset options to defaults
	 */
	async resetOptions(): Promise<UserOptions> {
		const resetOptions = { ...this.defaultOptions }
		loadUserOptions(resetOptions)
		await this.saveToFileSystem(resetOptions)
		return resetOptions
	}

	/**
	 * Get options file path for debugging
	 */
	getOptionsPath(): string {
		return this.optionsPath
	}
}

export const userOptionsService = new UserOptionsService()
