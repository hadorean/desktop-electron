import { derived, get, writable } from 'svelte/store'
import {
	colors,
	DefaultScreenProfile,
	DefaultScreenSettings,
	DefaultUserSettings,
	getThemeEditingSettings,
	getThemeScreenSettings,
	type DayNightMode,
	type ScreenProfile,
	type ScreenSettings,
	type ScreenType,
	type UserSettings
} from '../types'

const defaultScreenId = 'monitor1'

export const currentScreen = writable(defaultScreenId)

const defaultSettings: ScreenProfile = DefaultScreenProfile
const defaultUserSettings: UserSettings = DefaultUserSettings

export const isLocalMode = writable(false)

// Settings panel expansion state
export const expandSettings = writable(false)

// Flag to prevent server sync during internal operations
let preventServerSync = false

// Transition state stores
export const inTransition = writable<boolean>(false)
export const transitionSettings = writable<Partial<ScreenProfile>>({})
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
export const currentTheme = derived(allSettings, settings => settings.currentTheme)

// Derived store to check if current theme is night mode
export const isNightMode = derived(currentTheme, theme => theme === 'night')

export const screenIds = derived(allSettings, $allSettings =>
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
					...getThemeScreenSettings(allSettingsValue.screens[currentScreenId] ?? DefaultScreenSettings, fromTheme)
				}
			: getThemeScreenSettings(allSettingsValue.shared, fromTheme)

	const toSettings = isLocal
		? {
				...getThemeScreenSettings(allSettingsValue.shared, toTheme),
				...getThemeScreenSettings(allSettingsValue.screens[currentScreenId] ?? DefaultScreenSettings, toTheme)
			}
		: getThemeScreenSettings(allSettingsValue.shared, toTheme)

	// Update the theme immediately (this will sync to other clients)
	allSettings.update(settings => ({
		...settings,
		currentTheme: toTheme
	}))

	// Set transition state
	transitionStartTime = performance.now()
	transitionDuration = duration
	inTransition.set(true)
	transitionSettings.set(fromSettings)

	// Handle non-numeric properties immediately (booleans, strings, arrays)
	const immediateUpdates: Partial<ScreenProfile> = {
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
		const interpolatedSettings: Partial<ScreenProfile> = {
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
currentTheme.subscribe(newTheme => {
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
					...getThemeScreenSettings(allSettingsValue.screens[currentScreenId] ?? DefaultScreenSettings, fromTheme)
				}
			: getThemeScreenSettings(allSettingsValue.shared, fromTheme)

	const toSettings = isLocal
		? {
				...getThemeScreenSettings(allSettingsValue.shared, toTheme),
				...getThemeScreenSettings(allSettingsValue.screens[currentScreenId] ?? DefaultScreenSettings, toTheme)
			}
		: getThemeScreenSettings(allSettingsValue.shared, toTheme)

	// Set transition state
	transitionStartTime = performance.now()
	transitionDuration = duration
	inTransition.set(true)
	transitionSettings.set(fromSettings)

	// Handle non-numeric properties immediately (booleans, strings, arrays)
	const immediateUpdates: Partial<ScreenProfile> = {
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
		const interpolatedSettings: Partial<ScreenProfile> = {
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
	allSettings.update(settings => ({
		...settings,
		currentTheme: theme
	}))
}

export function getCurrentTheme(): DayNightMode {
	return get(allSettings).currentTheme
}

// Return the day/night settings for a given screen id
export function getScreenDayNightSettings(id: string): ScreenSettings {
	const value = get(allSettings)
	return value.screens[id] ?? DefaultScreenSettings
}

// Return the settings for a given screen id
export function getScreenSettings(id: string): Partial<ScreenProfile> | undefined {
	const value = get(allSettings)
	const theme = getCurrentTheme() as 'day' | 'night'
	return value.screens[id]?.[theme] ?? {}
}

// Base screen settings without transitions (for syncing to other clients)
export const baseScreenSettings = derived([allSettings, currentScreen, currentTheme, isLocalMode], ([all, screen, theme, isLocal]) => {
	const currentTheme = theme as 'day' | 'night'
	const themeShared = getThemeScreenSettings(all.shared, currentTheme)
	return isLocal ? { ...themeShared, ...getThemeScreenSettings(all.screens[screen] ?? DefaultScreenSettings, currentTheme) } : themeShared
})

// Settings to use to render the current screen image (includes transitions for UI)
export const screenSettings = derived([baseScreenSettings, inTransition, transitionSettings], ([base, isTransitioning, transition]) => {
	// During transition, return the interpolated transition settings for UI display
	return isTransitioning ? transition : base
})

// Base editing settings without transitions (for syncing to other clients)
export const baseEditingSettings = derived([allSettings, currentScreen, currentTheme, isLocalMode], ([all, screen, theme, isLocal]) => {
	const currentTheme = theme as 'day' | 'night'
	return isLocal ? getThemeEditingSettings(all.screens[screen] ?? DefaultScreenSettings, currentTheme) : getThemeEditingSettings(all.shared, currentTheme)
})

// Settings to use in the settings panel (includes transitions for UI display)
export const editingSettings = derived([baseEditingSettings, inTransition, transitionSettings], ([base, isTransitioning, transition]) => {
	// During transition, return the interpolated transition settings for UI display
	return isTransitioning ? transition : base
})

export function updateSharedSettings(settings: (current: Partial<ScreenProfile>) => Partial<ScreenProfile>): void {
	const theme = getCurrentTheme() as 'day' | 'night'

	allSettings.update(value => {
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
export function updateSharedSettingsSilent(settings: (current: Partial<ScreenProfile>) => Partial<ScreenProfile>): void {
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

export function updateLocalSettings(settings: (current: Partial<ScreenProfile>) => Partial<ScreenProfile>): void {
	allSettings.update(value => {
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
export function updateLocalSettingsSilent(settings: (current: Partial<ScreenProfile>) => Partial<ScreenProfile>): void {
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
export function updateEditingSettings(settings: (current: Partial<ScreenProfile>) => Partial<ScreenProfile>): void {
	if (get(isLocalMode)) {
		// Update local screen settings for current theme
		const screen = get(currentScreen) || defaultScreenId
		const theme = getCurrentTheme() as 'day' | 'night'

		allSettings.update(value => {
			const currentScreenSettings = value.screens[screen] ?? DefaultScreenSettings
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

		allSettings.update(value => {
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

/**
 * Assign screen type based on screen name/context
 */
export function assignScreenType(screenId: string): ScreenType {
	if (screenId.toLowerCase().includes('browser')) {
		return 'interactive'
	}
	if (screenId.toLowerCase().includes('monitor')) {
		return 'static'
	}
	// Default to static for unknown screen types
	return 'static'
}

/**
 * Assign a color to a screen from the predefined palette using index-based assignment
 */
export function assignScreenColor(screenId: string, allScreenIds: string[]): string {
	// Skip white (index 0) - reserved for shared/home
	const availableColors = colors.slice(1)

	// Get the index of this screen in the sorted list
	const sortedScreenIds = [...allScreenIds].sort()
	const screenIndex = sortedScreenIds.indexOf(screenId)

	// Use modulo to cycle through available colors if we have more screens than colors
	const colorIndex = screenIndex % availableColors.length

	return availableColors[colorIndex]
}

/**
 * Ensure all screens have proper settings (colors and types are now computed, not stored)
 */
export function normalizeScreenSettings(): void {
	// Colors and types are now computed on-demand, so this function only ensures
	// that screen settings exist but doesn't store computed values
	allSettings.update(settings => {
		// No changes needed - colors and types are computed on demand
		// This function is kept for potential future normalization needs
		return settings
	})
}

/**
 * Get formatted screen name based on computed type and ID
 */
export function getFormattedScreenName(screenId: string, _screenSettings?: ScreenSettings): string {
	// Always compute type from screenId (screenSettings param kept for compatibility)
	const screenType = assignScreenType(screenId)

	if (screenType === 'interactive') {
		return 'Browser'
	} else {
		// Static screen - extract monitor number if possible
		const match = screenId.match(/(\d+)/)
		return match ? `Monitor ${match[1]}` : 'Monitor'
	}
}

/**
 * Get the current screen's color (computed from screen index)
 */
export const currentScreenColor = derived([allSettings, currentScreen, isLocalMode], ([$allSettings, $currentScreen, $isLocalMode]) => {
	if (!$isLocalMode) {
		// Shared/home screen uses white
		return '#ffffff'
	}

	// Compute color based on screen index in the sorted list
	const allScreenIds = Object.keys($allSettings.screens).sort()
	return assignScreenColor($currentScreen, allScreenIds)
})

export const currentScreenType = derived([currentScreen, isLocalMode], ([$currentScreen, $isLocalMode]) => {
	if (!$isLocalMode) {
		return 'shared'
	}
	// Compute type based on screenId pattern
	return assignScreenType($currentScreen)
})

// loadSettings function moved to localStorage service
// This function is now deprecated - use localStorageService.loadSettings() instead
export function loadSettings(images: { name: string }[]): string {
	console.warn('settingsStore.loadSettings() is deprecated. Use localStorageService.loadSettings() instead.')
	// Fallback: just set default image if available
	if (images.length > 0) {
		updateSharedSettings(current => ({
			...current,
			selectedImage: images[0].name
		}))
		return images[0].name
	}
	return ''
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
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function validateSelectedImages(availableImages: string[]): boolean {
	const hasChanges = false
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

	// validateSelectedImages localStorage logic moved to localStorage service
	console.warn('settingsStore.validateSelectedImages() localStorage logic is now handled by localStorageService.validateSelectedImages()')

	return hasChanges
}
