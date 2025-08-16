import { userOptionsStore } from '$shared/stores/userOptionsStore'
import type { UserOptions, UserOptionsUpdateEvent } from '$shared/types'
import { DefaultUserOptions } from '$shared/types/user-options'
import { app } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'
import type { LocalServer } from '../server'
import { localServer as localServerStore } from '../stores/appStore'

export class UserOptionsService {
	private optionsPath: string
	private defaultOptions: UserOptions = DefaultUserOptions
	private hasInitialized = false
	private localServer: LocalServer | null = null
	private previousImageDirectory = ''

	constructor() {
		this.optionsPath = join(app.getPath('userData'), 'user-options.json')
		localServerStore.subscribe(server => {
			this.localServer = server
		})
	}

	/**
	 * Initialize the service - load from file and setup store subscription
	 */
	async initialize(): Promise<void> {
		if (this.hasInitialized) return

		// Load options from file system
		await this.loadFromFileSystem()

		// Subscribe to store changes for automatic persistence and socket broadcasting
		userOptionsStore.userOptions.subscribe(options => {
			// console.log('🔧 UserOptionsService subscription triggered with options:', options)
			// console.log('🔧 shouldPreventSync():', shouldPreventSync())
			// console.log('🔧 this.hasInitialized:', this.hasInitialized)

			// Skip persistence during initial load and internal operations
			if (!userOptionsStore.isPreventingSync() && this.hasInitialized) {
				// console.log('🔧 UserOptionsService: Auto-saving options to file system')
				this.saveToFileSystem(options).catch(error => {
					console.error('Failed to save user options:', error)
				})
			} else {
				// console.log('🔧 UserOptionsService: Skipping auto-save (preventSync:', shouldPreventSync(), 'initialized:', this.hasInitialized, ')')
			}

			// Broadcast image directory changes to clients
			if (this.hasInitialized && this.localServer && this.previousImageDirectory && this.previousImageDirectory !== options.imageDirectory) {
				// console.log('🔄 UserOptionsService: Broadcasting image directory change to clients')
				this.localServer.sockets.broadcastImagesUpdated('manual_refresh', 'image-directory-changed', 'user_options_change')
			}
			this.previousImageDirectory = options.imageDirectory
		})

		this.hasInitialized = true
		// console.log('🔧 UserOptionsService initialized')
	}

	/**
	 * Get current options
	 */
	getCurrentOptions(): UserOptions {
		return userOptionsStore.getCurrent()
	}

	/**
	 * Update options and persist to file system
	 */
	async updateOptions(newOptions: Partial<UserOptions>, clientId: string): Promise<UserOptionsUpdateEvent> {
		const currentOptions = userOptionsStore.getCurrent()
		const updatedOptions = { ...currentOptions, ...newOptions }

		// Update store (this will trigger auto-save via subscription)
		// Skip prevent sync since this is an intentional update operation
		userOptionsStore.set(updatedOptions, true)

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
			userOptionsStore.set(options)

			console.log('🔧 User options loaded from file system:', this.optionsPath)
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				console.log('🔧 User options file not found, using defaults')
				userOptionsStore.set(this.defaultOptions)
				await this.saveToFileSystem(this.defaultOptions)
			} else {
				console.error('Error loading user options:', error)
				userOptionsStore.set(this.defaultOptions)
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
		userOptionsStore.set(resetOptions)
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

const userOptionsService = new UserOptionsService()

export const initUserOptions = async () => {
	await userOptionsService.initialize()
}

export const update = async (newOptions: Partial<UserOptions>, clientId: string): Promise<UserOptionsUpdateEvent> => {
	return await userOptionsService.updateOptions(newOptions, clientId)
}
