import { get, writable, derived } from 'svelte/store'
import { type ScreenSettings, type UserSettings, type DayNightMode, type DayNightScreenSettings, getThemeScreenSettings, getThemeEditingSettings } from '../types'
import { DefaultScreenSettings, DefaultUserSettings, DefaultDayNightSettings } from '../types'

const defaultScreenId = 'monitor1'

export const currentScreen = writable(defaultScreenId)



currentScreen.subscribe((screenId) => {
	// Update the current screen in localStorage
	localStorage.setItem('currentScreen', screenId)
})

const defaultSettings: ScreenSettings = DefaultScreenSettings
const defaultUserSettings: UserSettings = DefaultUserSettings

export const isLocalMode = writable(false)

// Settings panel expansion state
export const expandSettings = writable(false)

// Flag to prevent server sync during internal operations
let preventServerSync = false

export const allSettings = writable<UserSettings>(defaultUserSettings)

// Derived store for current theme from UserSettings
export const currentTheme = derived(allSettings, (settings) => settings.currentTheme)

// Derived store to check if current theme is night mode
export const isNightMode = derived(currentTheme, (theme) => theme === 'night')

export const screenIds = derived(allSettings, ($allSettings) =>
	Array.from(new Set([...Object.keys($allSettings.screens), get(currentScreen), get(currentScreen)])).sort()
)

export function setCurrentScreen(screenId: string): void {
	currentScreen.set(screenId)
}

// Function to toggle day/night mode
export function toggleDayNightMode(): void {
	allSettings.update((settings) => ({
		...settings,
		currentTheme: settings.currentTheme === 'night' ? 'day' : 'night'
	}))
}

export function setCurrentTheme(theme: DayNightMode): void {
	allSettings.update((settings) => ({
		...settings,
		currentTheme: theme
	}))
}

export function getCurrentTheme(): DayNightMode {
	return get(allSettings).currentTheme
}

// Return the day/night settings for a given screen id
export function getScreenDayNightSettings(id: string): DayNightScreenSettings {
	const value = get(allSettings)
	return value.screens[id] ?? DefaultDayNightSettings
}

// Return the settings for a given screen id
export function getScreenSettings(id: string): Partial<ScreenSettings> | undefined {
	const value = get(allSettings)
	const theme = getCurrentTheme() as 'day' | 'night'
	return value.screens[id]?.[theme] ?? {}
}

// Settings to use to render the current screen image
export const screenSettings = derived([allSettings, currentScreen, currentTheme, isLocalMode], ([all, screen, theme, isLocal]) => {
	const currentTheme = theme as 'day' | 'night'
	const themeShared = getThemeScreenSettings(all.shared, currentTheme)
	return isLocal ? { ...themeShared, ...getThemeScreenSettings(all.screens[screen], currentTheme) } : themeShared
})

// Settings to use in the settings panel
export const editingSettings = derived([allSettings, currentScreen, currentTheme, isLocalMode], ([all, screen, theme, isLocal]) => {
	const currentTheme = theme as 'day' | 'night'
	return isLocal ? getThemeEditingSettings(all.screens[screen], currentTheme) : getThemeEditingSettings(all.shared, currentTheme)
})

export function updateSharedSettings(settings: (current: Partial<ScreenSettings>) => Partial<ScreenSettings>): void {
	const theme = getCurrentTheme() as 'day' | 'night'

	allSettings.update((value) => {
		const currentSharedSettings = value.shared
		const currentThemeSettings = getThemeEditingSettings(currentSharedSettings, theme)
		const updatedSettings = settings(currentThemeSettings)

		return {
			...value,
			shared: {
				...currentSharedSettings,
				[theme]: updatedSettings
			}
		}
	})
}

/**
 * Update shared settings without triggering server sync (for internal operations like validation)
 */
export function updateSharedSettingsSilent(settings: (current: Partial<ScreenSettings>) => Partial<ScreenSettings>): void {
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
		const theme = getCurrentTheme() as 'day' | 'night'
		const currentScreenSettings = value.screens[screen] ?? { day: {}, night: {} }
		const currentThemeSettings = currentScreenSettings[theme] ?? {}
		const updatedThemeSettings = settings(currentThemeSettings)

		return {
			...value,
			screens: {
				...value.screens,
				[screen]: {
					...currentScreenSettings,
					[theme]: updatedThemeSettings
				}
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
 * Update settings for the current context (shared or local screen+theme)
 * This function handles the day/night logic and null checks automatically
 */
export function updateEditingSettings(settings: (current: Partial<ScreenSettings>) => Partial<ScreenSettings>): void {
	if (get(isLocalMode)) {
		// Update local screen settings for current theme
		const screen = get(currentScreen) || defaultScreenId
		const theme = getCurrentTheme() as 'day' | 'night'

		allSettings.update((value) => {
			const currentScreenSettings = value.screens[screen] ?? DefaultDayNightSettings
			const currentThemeSettings = currentScreenSettings[theme] ?? {}
			const updatedSettings = settings(currentThemeSettings)

			// If night mode and no overrides exist, don't create night settings
			if (theme === 'night' && currentScreenSettings.night === null && Object.keys(updatedSettings).length === 0) {
				return value
			}

			return {
				...value,
				screens: {
					...value.screens,
					[screen]: {
						...currentScreenSettings,
						[theme]: updatedSettings
					}
				}
			}
		})
	} else {
		// Update shared settings for current theme
		const theme = getCurrentTheme() as 'day' | 'night'

		allSettings.update((value) => {
			const currentSharedSettings = value.shared
			const currentThemeSettings = currentSharedSettings[theme] ?? {}
			const updatedSettings = settings(currentThemeSettings)

			// If night mode and no overrides exist, don't create night settings
			if (theme === 'night' && currentSharedSettings.night === null && Object.keys(updatedSettings).length === 0) {
				return value
			}

			return {
				...value,
				shared: {
					...currentSharedSettings,
					[theme]: updatedSettings
				}
			}
		})
	}
}

/**
 * Check if server sync should be prevented (for SettingsServerUpdate component)
 */
export function shouldPreventServerSync(): boolean {
	return preventServerSync
}

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

		return ''
	} catch (error) {
		console.error('Error loading settings from localStorage:', error)
		return `Error loading settings: ${error instanceof Error ? error.message : 'Unknown error'}`
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
	// const fallbackImage = availableImages.length > 0 ? availableImages[0] : ''

	// // Check shared settings
	// const currentSharedSettings = get(sharedSettings)
	// if (currentSharedSettings.selectedImage && !availableImages.includes(currentSharedSettings.selectedImage)) {
	// 	console.log(`📷 Shared selected image "${currentSharedSettings.selectedImage}" no longer exists, switching to "${fallbackImage}"`)
	// 	updateSharedSettingsSilent((settings) => ({
	// 		...settings,
	// 		selectedImage: fallbackImage
	// 	}))
	// 	hasChanges = true
	// }

	// // Check local settings for current screen
	// const currentLocalSettings = get(localSettings)
	// if (currentLocalSettings?.selectedImage && !availableImages.includes(currentLocalSettings.selectedImage)) {
	// 	console.log(`📷 Local selected image "${currentLocalSettings.selectedImage}" no longer exists, clearing override`)
	// 	updateLocalSettingsSilent((current) => {
	// 		if (!current) return {}
	// 		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	// 		const { selectedImage, ...rest } = current
	// 		return Object.keys(rest).length > 0 ? rest : {}
	// 	})
	// 	hasChanges = true
	// }

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
