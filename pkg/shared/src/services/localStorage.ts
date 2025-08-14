/**
 * localStorage service for managing state persistence
 * Handles initialization and synchronization of stores with localStorage
 */

import { get } from 'svelte/store'
import { checkStorageAvailability } from '../utils'
import { debugVisible, setDebugMenuVisible } from '../stores/debugStore'
import { apiBaseUrl } from '../stores/apiStore'
import { currentScreen, allSettings, updateSharedSettings, updateLocalSettings, isLocalMode } from '../stores/settingsStore'
import { type ScreenSettings, DefaultScreenSettings } from '../types'

class LocalStorageService {
	private isInitialized = false
	private unsubscribers: (() => void)[] = []

	/**
	 * Initialize the localStorage service
	 * Sets up initial state from localStorage and subscribes to store changes
	 */
	init(): void {
		// Only initialize in browser environment
		if (typeof window === 'undefined' || !checkStorageAvailability()) {
			console.log('📦 LocalStorage service: Not available, skipping initialization')
			return
		}

		if (this.isInitialized) {
			console.warn('📦 LocalStorage service already initialized')
			return
		}

		console.log('📦 Initializing localStorage service...')

		// Load initial state from localStorage
		this.loadInitialState()

		// Set up store subscriptions for automatic saving
		this.setupStoreSubscriptions()

		this.isInitialized = true
		console.log('📦 LocalStorage service initialized successfully')
	}

	/**
	 * Cleanup subscriptions (useful for testing or hot reload)
	 */
	cleanup(): void {
		this.unsubscribers.forEach((unsubscribe) => unsubscribe())
		this.unsubscribers = []
		this.isInitialized = false
		console.log('📦 LocalStorage service cleaned up')
	}

	/**
	 * Load initial state from localStorage
	 */
	private loadInitialState(): void {
		// Load debug state
		try {
			const savedDebugState = localStorage.getItem('debug.visible')
			if (savedDebugState !== null) {
				const isVisible = JSON.parse(savedDebugState)
				setDebugMenuVisible(isVisible)
			}
		} catch (error) {
			console.error('Error loading debug state from localStorage:', error)
		}

		// Load API URL
		try {
			const savedApiUrl = localStorage.getItem('apiBaseUrl')
			if (savedApiUrl) {
				apiBaseUrl.set(savedApiUrl)
				console.log('🔌 Loaded API URL from localStorage:', savedApiUrl)
			}
		} catch (error) {
			console.error('Error loading API URL from localStorage:', error)
		}

		// Load current screen
		try {
			const savedScreen = localStorage.getItem('currentScreen')
			if (savedScreen) {
				console.log('📦 Loaded saved screen from localStorage:', savedScreen)
				currentScreen.set(savedScreen)
			}
		} catch (error) {
			console.error('Error loading current screen from localStorage:', error)
		}
	}

	/**
	 * Load settings from localStorage for a given set of images
	 */
	loadSettings(images: { name: string }[]): string {
		if (typeof window === 'undefined' || !checkStorageAvailability()) {
			// Set default image if available in non-browser environments
			if (images.length > 0) {
				updateSharedSettings((current) => ({
					...current,
					selectedImage: images[0].name
				}))
				return images[0].name
			}
			return ''
		}

		try {
			// Try to load complete settings first (new approach)
			const savedCompleteSettings = localStorage.getItem('settings.complete')
			if (savedCompleteSettings) {
				const parsedCompleteSettings = JSON.parse(savedCompleteSettings)
				console.log('📦 Loading complete settings from localStorage')

				// Validate selected images in the complete settings
				this.validateAndUpdateImages(parsedCompleteSettings, images)

				// Set complete settings directly (like Socket.IO does)
				allSettings.set(parsedCompleteSettings)
			} else {
				// Fallback to legacy loading method
				console.log('📦 Using legacy settings loading method')

				// Load shared settings
				const savedSharedSettings = localStorage.getItem('settings.shared')
				if (savedSharedSettings) {
					const parsedSettings = JSON.parse(savedSharedSettings)
					const defaultSettings: ScreenSettings = DefaultScreenSettings

					updateSharedSettings(() => ({
						...defaultSettings,
						opacity: parsedSettings.opacity ?? defaultSettings.opacity,
						blur: parsedSettings.blur ?? defaultSettings.blur,
						saturation: parsedSettings.saturation ?? defaultSettings.saturation,
						hideButton: parsedSettings.hideButton ?? defaultSettings.hideButton,
						transitionTime: parsedSettings.transitionTime ?? defaultSettings.transitionTime,
						showTimeDate: parsedSettings.showTimeDate ?? defaultSettings.showTimeDate,
						showWeather: parsedSettings.showWeather ?? defaultSettings.showWeather,
						showScreenSwitcher: parsedSettings.showScreenSwitcher ?? defaultSettings.showScreenSwitcher,
						favorites: parsedSettings.favorites ?? defaultSettings.favorites,
						selectedImage:
							parsedSettings.selectedImage && images.some((img) => img.name === parsedSettings.selectedImage)
								? parsedSettings.selectedImage
								: images.length > 0
									? images[0].name
									: '',
						settingsButtonPosition: parsedSettings.settingsButtonPosition ?? defaultSettings.settingsButtonPosition
					}))
				} else if (images.length > 0) {
					updateSharedSettings((current) => ({
						...current,
						selectedImage: images[0].name
					}))
				}

				// Load local settings
				const savedLocalSettings = localStorage.getItem('settings.local')
				if (savedLocalSettings) {
					const parsedLocalSettings = JSON.parse(savedLocalSettings)
					updateLocalSettings(() => parsedLocalSettings)
				}
			}

			// Initialize screen from server data if available (after settings are loaded)
			const serverData = (window as { __SERVER_DATA__?: { screenId?: string } }).__SERVER_DATA__
			const initialScreenId = (window as { __INITIAL_SCREEN_ID__?: string }).__INITIAL_SCREEN_ID__ || serverData?.screenId

			console.log('📦 Checking for screen data:')
			console.log('  - __SERVER_DATA__:', serverData)
			console.log('  - __INITIAL_SCREEN_ID__:', (window as { __INITIAL_SCREEN_ID__?: string }).__INITIAL_SCREEN_ID__)
			console.log('  - Final screenId:', initialScreenId)

			if (initialScreenId) {
				console.log('🖥️  Using initial screen from server data:', initialScreenId)
				currentScreen.set(initialScreenId)
				isLocalMode.set(true)
				console.log('🖥️  Screen initialized:', initialScreenId, 'local mode: true')
				// Clear the server data to avoid reuse
				delete (window as { __INITIAL_SCREEN_ID__?: string }).__INITIAL_SCREEN_ID__
			}

			const currentSettings = get(allSettings)
			// Get the selected image from the current theme (day by default)
			const selectedImage = currentSettings.shared.day?.selectedImage
			return selectedImage || (images.length > 0 ? images[0].name : '')
		} catch (error) {
			console.error('Error loading settings from localStorage:', error)
			if (images.length > 0) {
				updateSharedSettings((current) => ({
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
		const imageNames = availableImages.map((img) => img.name)

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
						console.log(`📷 Screen "${screenId}" day selected image "${screenSettings.day.selectedImage}" no longer exists, clearing override`)
						delete screenSettings.day.selectedImage
						localSettingsChanged = true
					}

					// Check night settings
					if (screenSettings.night?.selectedImage && !availableImages.includes(screenSettings.night.selectedImage)) {
						console.log(`📷 Screen "${screenId}" night selected image "${screenSettings.night.selectedImage}" no longer exists, clearing override`)
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
	 * Set up automatic saving when stores change
	 */
	private setupStoreSubscriptions(): void {
		// Subscribe to debug state changes
		const unsubscribeDebug = debugVisible.subscribe((visible) => {
			try {
				localStorage.setItem('debug.visible', JSON.stringify(visible))
			} catch (error) {
				console.error('Error saving debug state to localStorage:', error)
			}
		})
		this.unsubscribers.push(unsubscribeDebug)

		// Subscribe to API URL changes
		const unsubscribeApi = apiBaseUrl.subscribe((value) => {
			try {
				localStorage.setItem('apiBaseUrl', value)
			} catch (error) {
				console.error('Error saving API URL to localStorage:', error)
			}
		})
		this.unsubscribers.push(unsubscribeApi)

		// Subscribe to current screen changes
		const unsubscribeScreen = currentScreen.subscribe((screenId) => {
			try {
				localStorage.setItem('currentScreen', screenId)
			} catch (error) {
				console.error('Error saving current screen to localStorage:', error)
			}
		})
		this.unsubscribers.push(unsubscribeScreen)

		// Subscribe to settings changes for automatic saving
		const unsubscribeSettings = allSettings.subscribe((settings) => {
			try {
				// Save complete settings object for immediate loading
				localStorage.setItem('settings.complete', JSON.stringify(settings))

				// Keep legacy storage for backward compatibility
				localStorage.setItem('settings.shared', JSON.stringify(settings.shared))
				if (Object.keys(settings.screens).length > 0) {
					localStorage.setItem('settings.local', JSON.stringify(settings.screens))
				}
			} catch (error) {
				console.error('Error saving settings to localStorage:', error)
			}
		})
		this.unsubscribers.push(unsubscribeSettings)
	}
}

// Export a singleton instance
export const localStorageService = new LocalStorageService()

// Export the class for testing
export { LocalStorageService }
