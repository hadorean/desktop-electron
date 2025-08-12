import { get, writable, derived } from 'svelte/store'
import {
	type ScreenSettings,
	type UserSettings,
	type DayNightMode,
	type DayNightScreenSettings,
	getThemeScreenSettings,
	getThemeEditingSettings
} from '../types'
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

// Transition state stores
export const inTransition = writable<boolean>(false)
export const transitionSettings = writable<Partial<ScreenSettings>>({})
let transitionStartTime = 0
let transitionDuration = 1000
let animationFrameId: number | null = null

// Interpolation helper functions
function lerp(start: number, end: number, progress: number): number {
	return start + (end - start) * progress
}

function easeQuadraticOut(t: number): number {
	return 1 - (1 - t) * (1 - t)
}

export const allSettings = writable<UserSettings>(defaultUserSettings)

// Derived store for current theme from UserSettings
export const currentTheme = derived(allSettings, (settings) => settings.currentTheme)

// Derived store to check if current theme is night mode
export const isNightMode = derived(currentTheme, (theme) => theme === 'night')

export const screenIds = derived(allSettings, ($allSettings) =>
	Array.from(new Set([...Object.keys($allSettings.screens), get(currentScreen), get(currentScreen)])).sort()
)

export function setCurrentScreen(screenId: string): void {
	console.log('Setting current screen to', screenId)
	currentScreen.set(screenId)
}

// Function to start a smooth theme transition
export function startThemeTransition(fromTheme: DayNightMode, toTheme: DayNightMode): void {
	// Cancel any existing transition
	if (animationFrameId !== null) {
		cancelAnimationFrame(animationFrameId)
		animationFrameId = null
	}

	// Get the current screen settings to determine transition duration
	const currentScreenId = get(currentScreen) || defaultScreenId
	const isLocal = get(isLocalMode)
	const allSettingsValue = get(allSettings)

	// Get transition duration from current screen's transitionTime
	let duration = 1000 // Default 1 second
	if (isLocal) {
		const screenDayNightSettings = allSettingsValue.screens[currentScreenId]
		if (screenDayNightSettings) {
			const currentSettings = getThemeScreenSettings(screenDayNightSettings, fromTheme)
			duration = (currentSettings.transitionTime ?? 1) * 1000
		}
	} else {
		const sharedSettings = getThemeScreenSettings(allSettingsValue.shared, fromTheme)
		duration = (sharedSettings.transitionTime ?? 1) * 1000
	}

	// Get start settings: use current transition values if in transition, otherwise theme values
	const fromSettings = get(inTransition)
		? get(transitionSettings) // Start from current interpolated values for smooth interruption
		: isLocal
			? {
					...getThemeScreenSettings(allSettingsValue.shared, fromTheme),
					...getThemeScreenSettings(allSettingsValue.screens[currentScreenId] ?? DefaultDayNightSettings, fromTheme)
				}
			: getThemeScreenSettings(allSettingsValue.shared, fromTheme)

	const toSettings = isLocal
		? {
				...getThemeScreenSettings(allSettingsValue.shared, toTheme),
				...getThemeScreenSettings(allSettingsValue.screens[currentScreenId] ?? DefaultDayNightSettings, toTheme)
			}
		: getThemeScreenSettings(allSettingsValue.shared, toTheme)

	// Update the theme immediately (this will sync to other clients)
	allSettings.update((settings) => ({
		...settings,
		currentTheme: toTheme
	}))

	// Set transition state
	transitionStartTime = performance.now()
	transitionDuration = duration
	inTransition.set(true)
	transitionSettings.set(fromSettings)

	// Handle non-numeric properties immediately (booleans, strings, arrays)
	const immediateUpdates: Partial<ScreenSettings> = {
		hideButton: toSettings.hideButton,
		showTimeDate: toSettings.showTimeDate,
		showWeather: toSettings.showWeather,
		showScreenSwitcher: toSettings.showScreenSwitcher,
		selectedImage: toSettings.selectedImage,
		favorites: toSettings.favorites,
		settingsButtonPosition: toSettings.settingsButtonPosition
	}

	// Start animation loop
	function animate(): void {
		const now = performance.now()
		const elapsed = now - transitionStartTime
		const progress = Math.min(elapsed / transitionDuration, 1)
		const easedProgress = easeQuadraticOut(progress)

		// Interpolate numeric values
		const interpolatedSettings: Partial<ScreenSettings> = {
			...immediateUpdates,
			opacity: lerp(fromSettings.opacity ?? 1, toSettings.opacity ?? 1, easedProgress),
			blur: lerp(fromSettings.blur ?? 0, toSettings.blur ?? 0, easedProgress),
			saturation: lerp(fromSettings.saturation ?? 1, toSettings.saturation ?? 1, easedProgress),
			transitionTime: lerp(fromSettings.transitionTime ?? 1, toSettings.transitionTime ?? 1, easedProgress)
		}

		transitionSettings.set(interpolatedSettings)

		if (progress >= 1) {
			// Transition complete
			inTransition.set(false)
			animationFrameId = null
		} else {
			// Continue animation
			animationFrameId = requestAnimationFrame(animate)
		}
	}

	// Start the animation
	animationFrameId = requestAnimationFrame(animate)
}

// Track previous theme to detect external changes
let previousTheme: DayNightMode | null = null

// Subscribe to theme changes and automatically start transitions for external updates
currentTheme.subscribe((newTheme) => {
	// Skip if this is the first subscription
	if (previousTheme === null) {
		previousTheme = newTheme
		return
	}

	// If theme changed externally (from other client), start smooth transition
	if (newTheme !== previousTheme) {
		const oldTheme = previousTheme
		previousTheme = newTheme

		// Start transition from old theme to new theme (but don't update currentTheme again)
		startThemeTransitionWithoutThemeUpdate(oldTheme, newTheme)
	}

	previousTheme = newTheme
})

// Internal function for transitions triggered by external theme changes
function startThemeTransitionWithoutThemeUpdate(fromTheme: DayNightMode, toTheme: DayNightMode): void {
	// Cancel any existing transition
	if (animationFrameId !== null) {
		cancelAnimationFrame(animationFrameId)
		animationFrameId = null
	}

	// Get the current screen settings to determine transition duration
	const currentScreenId = get(currentScreen) || defaultScreenId
	const isLocal = get(isLocalMode)
	const allSettingsValue = get(allSettings)

	// Get transition duration from current screen's transitionTime
	let duration = 1000 // Default 1 second
	if (isLocal) {
		const screenDayNightSettings = allSettingsValue.screens[currentScreenId]
		if (screenDayNightSettings) {
			const currentSettings = getThemeScreenSettings(screenDayNightSettings, fromTheme)
			duration = (currentSettings.transitionTime ?? 1) * 1000
		}
	} else {
		const sharedSettings = getThemeScreenSettings(allSettingsValue.shared, fromTheme)
		duration = (sharedSettings.transitionTime ?? 1) * 1000
	}

	// Get start settings: use current transition values if in transition, otherwise theme values
	const fromSettings = get(inTransition)
		? get(transitionSettings) // Start from current interpolated values for smooth interruption
		: isLocal
			? {
					...getThemeScreenSettings(allSettingsValue.shared, fromTheme),
					...getThemeScreenSettings(allSettingsValue.screens[currentScreenId] ?? DefaultDayNightSettings, fromTheme)
				}
			: getThemeScreenSettings(allSettingsValue.shared, fromTheme)

	const toSettings = isLocal
		? {
				...getThemeScreenSettings(allSettingsValue.shared, toTheme),
				...getThemeScreenSettings(allSettingsValue.screens[currentScreenId] ?? DefaultDayNightSettings, toTheme)
			}
		: getThemeScreenSettings(allSettingsValue.shared, toTheme)

	// Set transition state
	transitionStartTime = performance.now()
	transitionDuration = duration
	inTransition.set(true)
	transitionSettings.set(fromSettings)

	// Handle non-numeric properties immediately (booleans, strings, arrays)
	const immediateUpdates: Partial<ScreenSettings> = {
		hideButton: toSettings.hideButton,
		showTimeDate: toSettings.showTimeDate,
		showWeather: toSettings.showWeather,
		showScreenSwitcher: toSettings.showScreenSwitcher,
		selectedImage: toSettings.selectedImage,
		favorites: toSettings.favorites,
		settingsButtonPosition: toSettings.settingsButtonPosition
	}

	// Start animation loop
	function animate(): void {
		const now = performance.now()
		const elapsed = now - transitionStartTime
		const progress = Math.min(elapsed / transitionDuration, 1)
		const easedProgress = easeQuadraticOut(progress)

		// Interpolate numeric values
		const interpolatedSettings: Partial<ScreenSettings> = {
			...immediateUpdates,
			opacity: lerp(fromSettings.opacity ?? 1, toSettings.opacity ?? 1, easedProgress),
			blur: lerp(fromSettings.blur ?? 0, toSettings.blur ?? 0, easedProgress),
			saturation: lerp(fromSettings.saturation ?? 1, toSettings.saturation ?? 1, easedProgress),
			transitionTime: lerp(fromSettings.transitionTime ?? 1, toSettings.transitionTime ?? 1, easedProgress)
		}

		transitionSettings.set(interpolatedSettings)

		if (progress >= 1) {
			// Transition complete
			inTransition.set(false)
			animationFrameId = null
		} else {
			// Continue animation
			animationFrameId = requestAnimationFrame(animate)
		}
	}

	// Start the animation
	animationFrameId = requestAnimationFrame(animate)
}

// Function to toggle day/night mode
export function toggleDayNightMode(): void {
	const currentThemeValue = getCurrentTheme()
	const targetTheme = currentThemeValue === 'night' ? 'day' : 'night'
	startThemeTransition(currentThemeValue, targetTheme)
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

// Base screen settings without transitions (for syncing to other clients)
export const baseScreenSettings = derived([allSettings, currentScreen, currentTheme, isLocalMode], ([all, screen, theme, isLocal]) => {
	const currentTheme = theme as 'day' | 'night'
	const themeShared = getThemeScreenSettings(all.shared, currentTheme)
	return isLocal ? { ...themeShared, ...getThemeScreenSettings(all.screens[screen] ?? DefaultDayNightSettings, currentTheme) } : themeShared
})

// Settings to use to render the current screen image (includes transitions for UI)
export const screenSettings = derived([baseScreenSettings, inTransition, transitionSettings], ([base, isTransitioning, transition]) => {
	// During transition, return the interpolated transition settings for UI display
	return isTransitioning ? transition : base
})

// Base editing settings without transitions (for syncing to other clients)
export const baseEditingSettings = derived([allSettings, currentScreen, currentTheme, isLocalMode], ([all, screen, theme, isLocal]) => {
	const currentTheme = theme as 'day' | 'night'
	return isLocal ? getThemeEditingSettings(all.screens[screen] ?? DefaultDayNightSettings, currentTheme) : getThemeEditingSettings(all.shared, currentTheme)
})

// Settings to use in the settings panel (includes transitions for UI display)
export const editingSettings = derived([baseEditingSettings, inTransition, transitionSettings], ([base, isTransitioning, transition]) => {
	// During transition, return the interpolated transition settings for UI display
	return isTransitioning ? transition : base
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

		// Initialize screen from server data if available (after settings are loaded)
		if (typeof window !== 'undefined') {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const initialScreenId = (window as any).__INITIAL_SCREEN_ID__
			if (initialScreenId) {
				console.log('🖥️  Applying initial screen after settings loaded:', initialScreenId)
				setCurrentScreen(initialScreenId)
				isLocalMode.set(true)
				console.log('🖥️  Screen initialized:', initialScreenId, 'local mode: true')
				// Clean up
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				delete (window as any).__INITIAL_SCREEN_ID__
			}
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
