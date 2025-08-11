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

import type { UISettings, ServerSettings, SettingsButtonPosition } from '../types'
import { DEFAULT_UI_SETTINGS, DEFAULT_SERVER_SETTINGS } from '../types'

// Legacy aliases for backward compatibility
export type Settings = UISettings
export type { SettingsButtonPosition }

const defaultSettings: Settings = DEFAULT_UI_SETTINGS

const defaultServerSettings: ServerSettings = DEFAULT_SERVER_SETTINGS

export const allSettings = writable<ServerSettings>(defaultServerSettings)

// Create a derived store that returns the list of screen IDs
export const screenIds = derived(allSettings, ($allSettings) =>
	Array.from(new Set([...Object.keys($allSettings.screens), get(currentScreen), get(routeParams).screenId])).sort()
)

// Return the settings for a given screen id
export function getScreenSettings(id: string): Partial<Settings> | undefined {
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

export function updateSharedSettings(settings: (current: Settings) => Partial<Settings>): void {
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

export function updateLocalSettings(settings: (current: Partial<Settings>) => Partial<Settings>): void {
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
function saveSharedSettings(currentSettings: Settings): string {
	try {
		localStorage.setItem('settings.shared', JSON.stringify(currentSettings))
		return ''
	} catch (error) {
		console.error('Error saving shared settings:', error)
		return `Error saving shared settings: ${error instanceof Error ? error.message : 'Unknown error'}`
	}
}

// Save local settings to localStorage
function saveLocalSettings(currentSettings: Partial<Settings> | null): string {
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
