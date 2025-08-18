/**
 * localStorage service for managing state persistence
 * Handles initialization and synchronization of stores with localStorage
 */

import { get } from 'svelte/store'
import { apiStore } from '../stores/apiStore'
import { debugMenu } from '../stores/debugStore'
import { settingsStore } from '../stores/settingsStore'
import { type UserSettings } from '../types'
import { checkStorageAvailability } from '../utils'

class LocalStorageService {
	private isInitialized = false
	private unsubscribers: (() => void)[] = []

	/**
	 * Initialize the localStorage service and load settings
	 * This is the unified method for complete initialization
	 */
	init(images: { name: string }[]): string {
		// Only initialize in browser environment
		if (typeof window === 'undefined' || !checkStorageAvailability()) {
			console.log('📦 LocalStorage service: Not available, skipping initialization')
			return ''
		}

		if (this.isInitialized) {
			console.warn('📦 LocalStorage service already initialized')
			return ''
		}

		console.log('📦 Initializing localStorage service...')

		this.loadInitialState()

		this.setupStoreSubscriptions([
			{ store: debugMenu.visibility, key: 'debug' },
			{ store: apiStore.url, key: 'api' },
			{ store: settingsStore.currentScreenId, key: 'screen' },
			{ store: settingsStore.allSettings, key: 'settings' }
		])

		this.isInitialized = true
		console.log('📦 LocalStorage service initialized successfully')

		return this.loadSettings(images)
	}

	/**
	 * Cleanup subscriptions (useful for testing or hot reload)
	 */
	cleanup(): void {
		this.unsubscribers.forEach(unsubscribe => unsubscribe())
		this.unsubscribers = []
		this.isInitialized = false
		console.log('📦 LocalStorage service cleaned up')
	}

	/**
	 * Load a value from localStorage and update a store
	 */
	private loadFromStorage<T>(
		storageKey: string,
		setter: (value: T) => void,
		parser: (value: string) => T = JSON.parse,
		description: string = storageKey,
		logSuccess: boolean = false
	): void {
		try {
			const savedValue = localStorage.getItem(storageKey)
			if (savedValue !== null) {
				const parsedValue = parser(savedValue)
				setter(parsedValue)
				if (logSuccess) {
					console.log(`📦 Loaded ${description} from localStorage:`, parsedValue)
				}
			}
		} catch (error) {
			console.error(`Error loading ${description} from localStorage:`, error)
		}
	}

	/**
	 * Load initial state from localStorage (non-settings data)
	 */
	private loadInitialState(): void {
		this.loadFromStorage('debug', debugMenu.setVisible, JSON.parse, 'debug state')
		this.loadFromStorage('api', apiStore.setServerUrl, value => value, 'API URL', true)
		this.loadFromStorage('screen', settingsStore.setCurrentScreen, value => value, 'saved screen', true)
	}

	/**
	 * Load complete settings from localStorage and initialize the settings store
	 */
	loadSettings(images: { name: string }[]): string {
		if (typeof window === 'undefined' || !checkStorageAvailability()) {
			// Set default image if available in non-browser environments
			if (images.length > 0) {
				settingsStore.updateSharedSettings(current => ({
					...current,
					selectedImage: images[0].name
				}))
				return images[0].name
			}
			return ''
		}

		try {
			// Try to load unified settings first
			const savedSettings = localStorage.getItem('settings')
			if (savedSettings) {
				const parsedSettings = JSON.parse(savedSettings)
				console.log('📦 Loading settings from localStorage')

				// Validate selected images in the settings
				this.validateAndUpdateImages(parsedSettings, images)

				// Clean up legacy color/type properties (migration)
				this.cleanupLegacyColorTypeData(parsedSettings)

				// Set settings directly
				settingsStore.updateSettings(parsedSettings)
			}

			// Initialize screen from server data if available (after settings are loaded)
			const serverData = (window as { __SERVER_DATA__?: { screenId?: string } }).__SERVER_DATA__
			const initialScreenId =
				(window as { __INITIAL_SCREEN_ID__?: string }).__INITIAL_SCREEN_ID__ || serverData?.screenId

			console.log('📦 Checking for screen data:')
			console.log('  - __SERVER_DATA__:', serverData)
			console.log('  - __INITIAL_SCREEN_ID__:', (window as { __INITIAL_SCREEN_ID__?: string }).__INITIAL_SCREEN_ID__)
			console.log('  - Final screenId:', initialScreenId)

			if (initialScreenId) {
				console.log('🖥️  Using initial screen from server data:', initialScreenId)
				settingsStore.setCurrentScreen(initialScreenId)
				settingsStore.setLocalMode(true)
				console.log('🖥️  Screen initialized:', initialScreenId, 'local mode: true')
				// Clear the server data to avoid reuse
				delete (window as { __INITIAL_SCREEN_ID__?: string }).__INITIAL_SCREEN_ID__
			}

			const currentSettings = get(settingsStore.allSettings)
			// Get the selected image from the current theme (day by default)
			const selectedImage = currentSettings.shared.day?.selectedImage
			return selectedImage || (images.length > 0 ? images[0].name : '')
		} catch (error) {
			console.error('Error loading settings from localStorage:', error)
			if (images.length > 0) {
				settingsStore.updateSharedSettings(current => ({
					...current,
					selectedImage: images[0].name
				}))
				return images[0].name
			}
			return ''
		}
	}

	/**
	 * Validate and update images in complete settings object
	 */
	private validateAndUpdateImages(
		settings: {
			shared?: { day?: { selectedImage?: string }; night?: { selectedImage?: string } }
			screens?: Record<string, { day?: { selectedImage?: string }; night?: { selectedImage?: string } }>
		},
		availableImages: { name: string }[]
	): void {
		const imageNames = availableImages.map(img => img.name)

		// Validate shared settings
		if (settings.shared?.day?.selectedImage && !imageNames.includes(settings.shared.day.selectedImage)) {
			console.log('📷 Shared day selected image no longer exists, clearing')
			delete settings.shared.day.selectedImage
		}
		if (settings.shared?.night?.selectedImage && !imageNames.includes(settings.shared.night.selectedImage)) {
			console.log('📷 Shared night selected image no longer exists, clearing')
			delete settings.shared.night.selectedImage
		}

		// Validate screen-specific settings
		if (settings.screens) {
			for (const screenId in settings.screens) {
				const screenSettings = settings.screens[screenId]
				if (screenSettings.day?.selectedImage && !imageNames.includes(screenSettings.day.selectedImage)) {
					console.log(`📷 Screen "${screenId}" day selected image no longer exists, clearing`)
					delete screenSettings.day.selectedImage
				}
				if (screenSettings.night?.selectedImage && !imageNames.includes(screenSettings.night.selectedImage)) {
					console.log(`📷 Screen "${screenId}" night selected image no longer exists, clearing`)
					delete screenSettings.night.selectedImage
				}
			}
		}
	}

	/**
	 * Validate selected images in localStorage and update if necessary
	 */
	validateSelectedImages(availableImages: string[]): boolean {
		if (typeof window === 'undefined' || !checkStorageAvailability()) {
			return false
		}

		try {
			const allLocalSettingsString = localStorage.getItem('settings.local')
			if (allLocalSettingsString) {
				const allLocalSettings = JSON.parse(allLocalSettingsString)
				let localSettingsChanged = false

				for (const screenId in allLocalSettings) {
					const screenSettings = allLocalSettings[screenId]

					// Check day settings
					if (screenSettings.day?.selectedImage && !availableImages.includes(screenSettings.day.selectedImage)) {
						console.log(
							`📷 Screen "${screenId}" day selected image "${screenSettings.day.selectedImage}" no longer exists, clearing override`
						)
						delete screenSettings.day.selectedImage
						localSettingsChanged = true
					}

					// Check night settings
					if (screenSettings.night?.selectedImage && !availableImages.includes(screenSettings.night.selectedImage)) {
						console.log(
							`📷 Screen "${screenId}" night selected image "${screenSettings.night.selectedImage}" no longer exists, clearing override`
						)
						delete screenSettings.night.selectedImage
						localSettingsChanged = true
					}

					// Clean up empty settings
					if (screenSettings.day && Object.keys(screenSettings.day).length === 0) {
						delete screenSettings.day
					}
					if (screenSettings.night && Object.keys(screenSettings.night).length === 0) {
						screenSettings.night = null
					}
					if (!screenSettings.day && !screenSettings.night) {
						delete allLocalSettings[screenId]
						localSettingsChanged = true
					}
				}

				if (localSettingsChanged) {
					if (Object.keys(allLocalSettings).length === 0) {
						localStorage.removeItem('settings.local')
					} else {
						localStorage.setItem('settings.local', JSON.stringify(allLocalSettings))
					}
					return true
				}
			}
		} catch (error) {
			console.error('Error validating selected images in localStorage:', error)
		}

		return false
	}

	/**
	 * Clean up legacy color and type properties from settings (migration helper)
	 */
	private cleanupLegacyColorTypeData(settings: UserSettings): void {
		try {
			let hasChanges = false

			// Clean up shared settings (using any for legacy property access)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const sharedAny = settings.shared as any
			if (sharedAny && ('color' in sharedAny || 'type' in sharedAny)) {
				console.log('🧹 Cleaning up legacy color/type from shared settings')
				delete sharedAny.color
				delete sharedAny.type
				hasChanges = true
			}

			// Clean up screen settings
			if (settings.screens) {
				for (const screenId in settings.screens) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const screenSettingsAny = settings.screens[screenId] as any
					if ('color' in screenSettingsAny || 'type' in screenSettingsAny) {
						console.log(`🧹 Cleaning up legacy color/type from screen "${screenId}"`)
						delete screenSettingsAny.color
						delete screenSettingsAny.type
						hasChanges = true
					}
				}
			}

			// Save cleaned settings back to localStorage if changes were made
			if (hasChanges) {
				localStorage.setItem('settings', JSON.stringify(settings))
				console.log('🧹 Saved cleaned settings back to localStorage')
			}
		} catch (error) {
			console.error('Error cleaning up legacy color/type data:', error)
		}
	}

	/**
	 * Set up automatic saving when stores change
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private setupStoreSubscriptions(subscriptions: { store: any; key: string }[]): void {
		subscriptions.forEach(({ store, key }) => {
			const unsubscribe = this.subscribeToStore(store, key)
			this.unsubscribers.push(unsubscribe)
		})
	}

	/**
	 * Subscribe to a store and automatically save its value to localStorage
	 */
	private subscribeToStore<T>(
		store: { subscribe: (callback: (value: T) => void) => () => void },
		storageKey: string,
		transform: (value: T) => string = (value: T) => (typeof value === 'string' ? value : JSON.stringify(value)),
		description: string = storageKey
	): () => void {
		return store.subscribe(value => {
			try {
				localStorage.setItem(storageKey, transform(value))
			} catch (error) {
				console.error(`Error saving ${description} to localStorage:`, error)
			}
		})
	}
}

// Export a singleton instance
export const localStorageService = new LocalStorageService()
