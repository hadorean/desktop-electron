import { get, writable, derived } from 'svelte/store'
import { routeParams, defaultScreenId } from './routeStore'

export const currentScreen = writable(defaultScreenId)

routeParams.subscribe((params) => {
	currentScreen.set(params.screenId)
})

currentScreen.subscribe((screenId) => {
	// Update the current screen in localStorage
	localStorage.setItem('currentScreen', screenId)
})

import type { ScreenSettings, UserSettings, SettingsButtonPosition } from '../types'
import { DefaultScreenSettings, DefaultUserSettings } from '../types'

// Legacy aliases for backward compatibility
export type { SettingsButtonPosition }

const defaultSettings: ScreenSettings = DefaultScreenSettings

const defaultUserSettings: UserSettings = DefaultUserSettings

// Flag to prevent server sync during internal operations
let preventServerSync = false

export const allSettings = writable<UserSettings>(defaultUserSettings)

// Create a derived store that returns the list of screen IDs
export const screenIds = derived(allSettings, ($allSettings) =>
	Array.from(new Set([...Object.keys($allSettings.screens), get(currentScreen), get(routeParams).screenId])).sort()
)

// Return the settings for a given screen id
export function getScreenSettings(id: string): Partial<ScreenSettings> | undefined {
	const value = get(allSettings)
	return value.screens[id] ?? {}
}

// Create the shared settings store (synced with server)
export const sharedSettings = derived([allSettings], ([all]) => ({
	...all.shared
}))

// Create the local settings store (overrides)
export const localSettings = derived([allSettings, currentScreen], ([all, screen]) => ({
	...(all.screens[screen] ?? {})
}))

export function updateSharedSettings(settings: (current: ScreenSettings) => Partial<ScreenSettings>): void {
	allSettings.update((value) => {
		return {
			...value,
			shared: {
				...value.shared,
				...settings(value.shared)
			}
		}
	})
}

/**
 * Update shared settings without triggering server sync (for internal operations like validation)
 */
export function updateSharedSettingsSilent(settings: (current: ScreenSettings) => Partial<ScreenSettings>): void {
	preventServerSync = true
	try {
		updateSharedSettings(settings)
	} finally {
		// Reset flag after a microtask to ensure all synchronous effects complete
		Promise.resolve().then(() => {
			preventServerSync = false
		})
	}
}

export function updateLocalSettings(settings: (current: Partial<ScreenSettings>) => Partial<ScreenSettings>): void {
	allSettings.update((value) => {
		const screen = get(currentScreen) || defaultScreenId
		const currentSettings = value.screens[screen] ?? {}
		const updatedSettings = settings(currentSettings)
		return {
			...value,
			screens: {
				...value.screens,
				[screen]: updatedSettings
			}
		}
	})
}

/**
 * Update local settings without triggering server sync (for internal operations like validation)
 */
export function updateLocalSettingsSilent(settings: (current: Partial<ScreenSettings>) => Partial<ScreenSettings>): void {
	preventServerSync = true
	try {
		updateLocalSettings(settings)
	} finally {
		// Reset flag after a microtask to ensure all synchronous effects complete
		Promise.resolve().then(() => {
			preventServerSync = false
		})
	}
}

/**
 * Check if server sync should be prevented (for SettingsServerUpdate component)
 */
export function shouldPreventServerSync(): boolean {
	return preventServerSync
}

// Create the derived settings store that merges shared and local settings
export const settings = derived([sharedSettings, localSettings], ([shared, local]) => ({
	...shared,
	...local
}))

export const hasLocalSettings = derived([localSettings], ([$local]) => {
	return $local !== null
})

export const isLocalMode = writable(false)

// Settings panel expansion state
export const expandSettings = writable(false)

// let updatingLocally = true;

// allSettings.subscribe((all) => {
//   updateLocal(() => {
//     if (all.shared) sharedSettings.set(all.shared);
//   });
// });

// sharedSettings.subscribe((shared) => {
//   updateLocal(() => {
//     allSettings.update((value) => {
//       return {
//         shared: shared,
//         screens: value.screens,
//       };
//     });
//   });
// });

// localSettings.subscribe((local) => {
//   updateOnChange(() => {
//     allSettings.set(all.shared);
//   });
// });
//

// updatingLocally = false;

// export function updateLocal(updateAction: () => void) {
//   if (updatingLocally) return;
//   updatingLocally = true;
//   try {
//     updateAction();
//   } finally {
//     updatingLocally = false;
//   }
// }

// Load settings from localStorage
export function loadSettings(images: { name: string }[]): string {
	try {
		// Load shared settings
		const savedSharedSettings = localStorage.getItem('settings.shared')
		if (savedSharedSettings) {
			const parsedSettings = JSON.parse(savedSharedSettings)
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

		// Subscribe to save changes
		sharedSettings.subscribe((newValue) => {
			saveSharedSettings(newValue)
		})

		localSettings.subscribe((newValue) => {
			saveLocalSettings(newValue)
		})

		return ''
	} catch (error) {
		console.error('Error loading settings from localStorage:', error)
		return `Error loading settings: ${error instanceof Error ? error.message : 'Unknown error'}`
	}
}

// Save shared settings to localStorage
function saveSharedSettings(currentSettings: ScreenSettings): string {
	try {
		localStorage.setItem('settings.shared', JSON.stringify(currentSettings))
		return ''
	} catch (error) {
		console.error('Error saving shared settings:', error)
		return `Error saving shared settings: ${error instanceof Error ? error.message : 'Unknown error'}`
	}
}

// Save local settings to localStorage
function saveLocalSettings(currentSettings: Partial<ScreenSettings> | null): string {
	try {
		if (currentSettings === null) {
			localStorage.removeItem('settings.local')
		} else {
			localStorage.setItem('settings.local', JSON.stringify(currentSettings))
		}
		return ''
	} catch (error) {
		console.error('Error saving local settings:', error)
		return `Error saving local settings: ${error instanceof Error ? error.message : 'Unknown error'}`
	}
}

// Reset settings to defaults
export function resetSettings(): void {
	updateSharedSettings(() => defaultSettings)
	//localSettings.set(null);
}

/**
 * Validate and fix selected images when the image list changes
 * Returns true if any settings were changed
 */
export function validateSelectedImages(availableImages: string[]): boolean {
	let hasChanges = false
	const fallbackImage = availableImages.length > 0 ? availableImages[0] : ''

	// Check shared settings
	const currentSharedSettings = get(sharedSettings)
	if (currentSharedSettings.selectedImage && !availableImages.includes(currentSharedSettings.selectedImage)) {
		console.log(`📷 Shared selected image "${currentSharedSettings.selectedImage}" no longer exists, switching to "${fallbackImage}"`)
		updateSharedSettingsSilent((settings) => ({
			...settings,
			selectedImage: fallbackImage
		}))
		hasChanges = true
	}

	// Check local settings for current screen
	const currentLocalSettings = get(localSettings)
	if (currentLocalSettings?.selectedImage && !availableImages.includes(currentLocalSettings.selectedImage)) {
		console.log(`📷 Local selected image "${currentLocalSettings.selectedImage}" no longer exists, clearing override`)
		updateLocalSettingsSilent((current) => {
			if (!current) return {}
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { selectedImage, ...rest } = current
			return Object.keys(rest).length > 0 ? rest : {}
		})
		hasChanges = true
	}

	// Check all local settings if we have access to them
	try {
		const allLocalSettingsString = localStorage.getItem('settings.local')
		if (allLocalSettingsString) {
			const allLocalSettings = JSON.parse(allLocalSettingsString)
			let localSettingsChanged = false

			for (const screenId in allLocalSettings) {
				const screenSettings = allLocalSettings[screenId]
				if (screenSettings.selectedImage && !availableImages.includes(screenSettings.selectedImage)) {
					console.log(`📷 Screen "${screenId}" selected image "${screenSettings.selectedImage}" no longer exists, clearing override`)
					delete screenSettings.selectedImage
					if (Object.keys(screenSettings).length === 0) {
						delete allLocalSettings[screenId]
					}
					localSettingsChanged = true
				}
			}

			if (localSettingsChanged) {
				if (Object.keys(allLocalSettings).length === 0) {
					localStorage.removeItem('settings.local')
				} else {
					localStorage.setItem('settings.local', JSON.stringify(allLocalSettings))
				}

				// Trigger a re-read of local settings only by updating allSettings screens
				allSettings.update((current) => ({
					...current,
					screens: allLocalSettings
				}))

				hasChanges = true
			}
		}
	} catch (error) {
		console.error('Error validating local settings:', error)
	}

	return hasChanges
}

// // Update a specific setting
// export function updateSetting<K extends keyof typeof defaultSettings>(
//   key: K,
//   value: typeof defaultSettings[K]
// ): void {
//   //console.log('Updating setting:', key, value);

//   settings.update(current => ({
//     ...current,
//     [key]: value
//   }));

// }
