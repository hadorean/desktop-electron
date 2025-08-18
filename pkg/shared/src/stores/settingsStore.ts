import { derived, get, readonly, writable } from 'svelte/store'
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

const currentScreenId = writable(defaultScreenId)

const isLocalMode = writable(false)

// Settings panel expansion state
const expandSettings = writable(false)

function setExpandSettings(value: boolean): void {
	expandSettings.set(value)
}

function toggleExpandSettings(): void {
	expandSettings.update(current => !current)
}

// Transition state stores
const inTransition = writable<boolean>(false)
const transitionSettings = writable<Partial<ScreenProfile>>({})

const allSettings = writable<UserSettings>(DefaultUserSettings)
const currentTheme = derived(allSettings, settings => {
	return settings.currentTheme
})
const isNightMode = derived(currentTheme, theme => {
	return theme === 'night'
})

const screenIds = derived(allSettings, $allSettings =>
	Array.from(new Set([...Object.keys($allSettings.screens), get(currentScreenId), get(currentScreenId)])).sort()
)

const rootSettings = derived([allSettings, currentTheme, isLocalMode], ([all, theme, isLocal]) => {
	const currentTheme = theme as 'day' | 'night'
	return isLocal
		? { ...DefaultScreenProfile, ...getThemeEditingSettings(all.shared, currentTheme) }
		: DefaultScreenProfile
})

// Base screen settings without transitions (for syncing to other clients)
const screenSettings = derived(
	[allSettings, currentScreenId, currentTheme, isLocalMode],
	([all, screen, theme, isLocal]) => {
		const currentTheme = theme as 'day' | 'night'
		const themeShared = getThemeScreenSettings(all.shared, currentTheme)
		return isLocal
			? ({
					...rootSettings,
					...getThemeScreenSettings(all.screens[screen] ?? DefaultScreenSettings, currentTheme)
				} as ScreenProfile)
			: ({ ...rootSettings, ...themeShared } as ScreenProfile)
	}
)

// Base editing settings without transitions (for syncing to other clients)
const editingSettings = derived(
	[allSettings, currentScreenId, currentTheme, isLocalMode],
	([all, screen, theme, isLocal]) => {
		const currentTheme = theme as 'day' | 'night'
		return isLocal
			? getThemeEditingSettings(all.screens[screen] ?? DefaultScreenSettings, currentTheme)
			: getThemeEditingSettings(all.shared, currentTheme)
	}
)

const currentScreen = derived([allSettings, currentScreenId], ([all, screenId]) => {
	return all.screens[screenId] ?? DefaultScreenSettings
})

const transitionTime = derived([screenSettings], ([screen]) => {
	return screen.transitionTime ?? 1
})

const currentScreenColor = derived(
	[allSettings, currentScreenId, isLocalMode],
	([$allSettings, $currentScreenId, $isLocalMode]) => {
		if (!$isLocalMode) {
			// Shared/home screen uses white
			return '#ffffff'
		}

		// Compute color based on screen index in the sorted list
		const allScreenIds = Object.keys($allSettings.screens).sort()
		return assignScreenColor($currentScreenId, allScreenIds)
	}
)

const currentScreenType = derived([currentScreenId, isLocalMode], ([screenId, local]) => {
	if (!local) {
		return 'shared'
	}
	// Compute type based on screenId pattern
	return assignScreenType(screenId)
})

let transitionStartTime = 0
let transitionDuration = 1000
let animationFrameId: number | null = null

// Flag to prevent server sync during internal operations
let preventServerSync = false

// Interpolation helper functions
function lerp(start: number, end: number, progress: number): number {
	return start + (end - start) * progress
}

function easeQuadraticOut(t: number): number {
	return 1 - (1 - t) * (1 - t)
}

function setCurrentScreen(screenId: string): void {
	console.log('Setting current screen to', screenId)
	currentScreenId.set(screenId)
}

function setLocalMode(local: boolean): void {
	isLocalMode.set(local)
}

// Function to start a smooth theme transition
function startThemeTransition(fromTheme: DayNightMode, toTheme: DayNightMode): void {
	// Get the current screen settings to determine transition duration
	const screenId = get(currentScreenId) || defaultScreenId
	const isLocal = get(isLocalMode)
	const allSettingsValue = get(allSettings)

	// Cancel any existing transition
	if (animationFrameId !== null) {
		cancelAnimationFrame(animationFrameId)
		animationFrameId = null
	}

	// Get transition duration from current screen's transitionTime
	let duration = 1000 // Default 1 second
	if (isLocal) {
		const screenDayNightSettings = allSettingsValue.screens[screenId]
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
					...getThemeScreenSettings(allSettingsValue.screens[screenId] ?? DefaultScreenSettings, fromTheme)
				}
			: getThemeScreenSettings(allSettingsValue.shared, fromTheme)

	const toSettings = isLocal
		? {
				...getThemeScreenSettings(allSettingsValue.shared, toTheme),
				...getThemeScreenSettings(allSettingsValue.screens[screenId] ?? DefaultScreenSettings, toTheme)
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
		mode: toSettings.mode,
		url: toSettings.url,
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
	const screenId = get(currentScreenId) || defaultScreenId
	const isLocal = get(isLocalMode)
	const allSettingsValue = get(allSettings)

	// Get transition duration from current screen's transitionTime
	let duration = 1000 // Default 1 second
	if (isLocal) {
		const screenDayNightSettings = allSettingsValue.screens[screenId]
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
					...getThemeScreenSettings(allSettingsValue.screens[screenId] ?? DefaultScreenSettings, fromTheme)
				}
			: getThemeScreenSettings(allSettingsValue.shared, fromTheme)

	const toSettings = isLocal
		? {
				...getThemeScreenSettings(allSettingsValue.shared, toTheme),
				...getThemeScreenSettings(allSettingsValue.screens[screenId] ?? DefaultScreenSettings, toTheme)
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
		mode: toSettings.mode,
		url: toSettings.url,
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
function toggleDayNightMode(): void {
	const currentThemeValue = getCurrentTheme()
	const targetTheme = currentThemeValue === 'night' ? 'day' : 'night'
	startThemeTransition(currentThemeValue, targetTheme)
}

function setCurrentTheme(theme: DayNightMode): void {
	allSettings.update(settings => ({
		...settings,
		currentTheme: theme
	}))
}

function setMonitorEnabled(enabled: boolean): void {
	const screenId = get(currentScreenId)
	allSettings.update(settings => ({
		...settings,
		screens: {
			...settings.screens,
			[screenId]: { ...settings.screens[get(currentScreenId)], monitorEnabled: enabled }
		}
	}))
}

function getCurrentTheme(): DayNightMode {
	return get(allSettings).currentTheme
}

// Return the day/night settings for a given screen id
function getScreenDayNightSettings(id: string): ScreenSettings {
	const value = get(allSettings)
	return value.screens[id] ?? DefaultScreenSettings
}

// Return the settings for a given screen id
function getScreenSettings(id: string): Partial<ScreenProfile> | undefined {
	const value = get(allSettings)
	const theme = getCurrentTheme() as 'day' | 'night'
	return value.screens[id]?.[theme] ?? {}
}

function updateSharedSettings(settings: (current: Partial<ScreenProfile>) => Partial<ScreenProfile>): void {
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
function updateSharedSettingsSilent(settings: (current: Partial<ScreenProfile>) => Partial<ScreenProfile>): void {
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

function updateLocalSettings(settings: (current: Partial<ScreenProfile>) => Partial<ScreenProfile>): void {
	allSettings.update(value => {
		const screen = get(currentScreenId) || defaultScreenId
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
function updateLocalSettingsSilent(settings: (current: Partial<ScreenProfile>) => Partial<ScreenProfile>): void {
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
function updateEditingSettings(settings: (current: Partial<ScreenProfile>) => Partial<ScreenProfile>): void {
	if (get(isLocalMode)) {
		// Update local screen settings for current theme
		const screenId = get(currentScreenId) || defaultScreenId
		const theme = getCurrentTheme() as 'day' | 'night'

		allSettings.update(value => {
			const currentScreenSettings = value.screens[screenId] ?? DefaultScreenSettings
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
					[screenId]: {
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
function shouldPreventServerSync(): boolean {
	return preventServerSync
}

/**
 * Assign screen type based on screen name/context
 */
function assignScreenType(screenId: string): ScreenType {
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
function assignScreenColor(screenId: string, allScreenIds: string[]): string {
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
function normalizeScreenSettings(): void {
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
function getFormattedScreenName(screenId: string): string {
	// Always compute type from screenId
	const screenType = assignScreenType(screenId)

	if (screenType === 'interactive') {
		return 'Browser'
	} else {
		// Static screen - extract monitor number if possible
		const match = screenId.match(/(\d+)/)
		return match ? `Monitor ${match[1]}` : 'Monitor'
	}
}

// Reset settings to defaults
function resetSettings(): void {
	updateSharedSettings(() => DefaultScreenProfile)
	//localSettings.set(null);
}

function updateSettings(settings: UserSettings): void {
	allSettings.set(settings)
}

export const settingsStore = {
	// Stores
	screenIds: readonly(screenIds),
	currentScreen: readonly(currentScreen),
	currentScreenId: readonly(currentScreenId),
	currentScreenColor: readonly(currentScreenColor),
	currentScreenType: readonly(currentScreenType),
	currentTheme: readonly(currentTheme),
	transitionTime: readonly(transitionTime),

	isLocalMode: readonly(isLocalMode),
	isNightMode: readonly(isNightMode),

	allSettings: readonly(allSettings),
	transitionSettings: readonly(transitionSettings),
	rootSettings: readonly(rootSettings),
	expandSettings: readonly(expandSettings),
	screenSettings: readonly(screenSettings),
	editingSettings: readonly(editingSettings),

	// Getters
	getCurrentTheme,
	getScreenDayNightSettings,
	getScreenSettings,
	getFormattedScreenName,
	shouldPreventServerSync,
	getTransitionTime: () => get(transitionTime),

	// Setters
	assignScreenType,
	assignScreenColor,
	setCurrentScreen,
	setLocalMode,
	setCurrentTheme,
	setMonitorEnabled,
	toggleDayNightMode,
	updateSharedSettings,
	updateSharedSettingsSilent,
	updateLocalSettings,
	updateLocalSettingsSilent,
	updateEditingSettings,
	normalizeScreenSettings,
	resetSettings,
	updateSettings,
	setExpandSettings,
	toggleExpandSettings
}
