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

const userSettings = writable<UserSettings>(DefaultUserSettings)

const currentTheme = derived(userSettings, settings => {
	return settings.currentTheme
})

const isNightTheme = derived(currentTheme, theme => {
	return theme === 'night'
})

const screenIds = derived(userSettings, $userSettings =>
	Array.from(new Set([...Object.keys($userSettings.screens), get(currentScreenId), get(currentScreenId)])).sort()
)

const baseProfile = derived([userSettings, currentTheme, isLocalMode], ([all, theme, isLocal]) => {
	const currentTheme = theme as 'day' | 'night'
	return isLocal
		? { ...DefaultScreenProfile, ...getThemeEditingSettings(all.shared, currentTheme) }
		: DefaultScreenProfile
})

// Active profile for the settings panel
const activeProfile = derived(
	[userSettings, currentScreenId, currentTheme, isLocalMode],
	([all, screen, theme, isLocal]) => {
		const currentTheme = theme as 'day' | 'night'
		return isLocal
			? getThemeScreenSettings(all.screens[screen] ?? DefaultScreenSettings, currentTheme)
			: getThemeScreenSettings(all.shared, currentTheme)
	}
)

// Merged profile for the current screen
const screenProfile = derived([activeProfile, baseProfile], ([active, base]) => {
	return {
		...base,
		...active
	} as ScreenProfile
})

const currentScreen = derived([userSettings, currentScreenId], ([all, screenId]) => {
	return all.screens[screenId] ?? DefaultScreenSettings
})

const transitionTime = derived([screenProfile], ([screen]) => {
	return screen.transitionTime ?? 1
})

const currentScreenColor = derived(
	[userSettings, currentScreenId, isLocalMode],
	([$userSettings, $currentScreenId, $isLocalMode]) => {
		if (!$isLocalMode) {
			// Shared/home screen uses white
			return '#ffffff'
		}

		// Compute color based on screen index in the sorted list
		const allScreenIds = Object.keys($userSettings.screens).sort()
		return getScreenColor($currentScreenId, allScreenIds)
	}
)

const currentScreenType = derived([currentScreenId, isLocalMode], ([screenId, local]) => {
	if (!local) {
		return 'shared'
	}
	// Compute type based on screenId pattern
	return getScreenType(screenId)
})

// Flag to prevent server sync during internal operations
let preventServerSync = false

function setCurrentScreen(screenId: string): void {
	console.log('Setting current screen to', screenId)
	currentScreenId.set(screenId)
}

function setLocalMode(local: boolean): void {
	isLocalMode.set(local)
}

function getCurrentTheme(): DayNightMode {
	return get(userSettings).currentTheme as 'day' | 'night'
}

function setCurrentTheme(theme: DayNightMode): void {
	userSettings.update(settings => ({
		...settings,
		currentTheme: theme
	}))
}

// Function to toggle day/night mode
function toggleDayNightMode(): void {
	const currentThemeValue = getCurrentTheme()
	const targetTheme = currentThemeValue === 'night' ? 'day' : 'night'
	setCurrentTheme(targetTheme)
}

function setMonitorEnabled(enabled: boolean): void {
	const screenId = get(currentScreenId)
	userSettings.update(settings => ({
		...settings,
		screens: {
			...settings.screens,
			[screenId]: { ...settings.screens[get(currentScreenId)], monitorEnabled: enabled }
		}
	}))
}

// Return the day/night settings for a given screen id
function getScreenSettings(id: string): ScreenSettings {
	const value = get(userSettings)
	return value.screens[id] ?? DefaultScreenSettings
}

// Return the settings for a given screen id
function getScreenProfile(id: string): Partial<ScreenProfile> | undefined {
	const value = get(userSettings)
	const theme = getCurrentTheme() as 'day' | 'night'
	return value.screens[id]?.[theme] ?? {}
}

function updateSharedSettings(settings: (current: Partial<ScreenProfile>) => Partial<ScreenProfile>): void {
	const theme = getCurrentTheme() as 'day' | 'night'

	userSettings.update(value => {
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

function updateLocalSettings(settings: (current: Partial<ScreenProfile>) => Partial<ScreenProfile>): void {
	userSettings.update(value => {
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
 * Update settings for the current context (shared or local screen+theme)
 * This function handles the day/night logic and null checks automatically
 */
function updateEditingProfile(modifier: (current: Partial<ScreenProfile>) => Partial<ScreenProfile>): void {
	if (get(isLocalMode)) {
		// Update local screen settings for current theme
		const screenId = get(currentScreenId) || defaultScreenId
		const theme = getCurrentTheme()

		userSettings.update(value => {
			const currentScreenSettings = value.screens[screenId] ?? DefaultScreenSettings
			const currentProfile = currentScreenSettings[theme] ?? {}
			const updatedProfile = modifier(currentProfile)

			// If night mode and no overrides exist, don't create night settings
			if (theme === 'night' && currentScreenSettings.night === null && Object.keys(updatedProfile).length === 0) {
				return value
			}

			return {
				...value,
				screens: {
					...value.screens,
					[screenId]: {
						...currentScreenSettings,
						[theme]: updatedProfile
					}
				}
			}
		})
	} else {
		// Update shared settings for current theme
		const theme = getCurrentTheme()

		userSettings.update(value => {
			const currentScreenSettings = value.shared
			const currentProfile = currentScreenSettings[theme] ?? {}
			const updatedProfile = modifier(currentProfile)

			// If night mode and no overrides exist, don't create night settings
			if (theme === 'night' && currentScreenSettings.night === null && Object.keys(updatedProfile).length === 0) {
				return value
			}

			return {
				...value,
				shared: {
					...currentScreenSettings,
					[theme]: updatedProfile
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
function getScreenType(screenId: string): ScreenType {
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
function getScreenColor(screenId: string, allScreenIds: string[]): string {
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
	userSettings.update(settings => {
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
	const screenType = getScreenType(screenId)

	if (screenType === 'interactive') {
		return 'Browser'
	} else {
		// Static screen - extract monitor number if possible
		const match = screenId.match(/(\d+)/)
		return match ? `Monitor ${match[1]}` : 'Monitor'
	}
}

function updateSettings(settings: UserSettings): void {
	userSettings.set(settings)
}

function resetSettings(): void {
	updateSettings(DefaultUserSettings)
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
	isNightTheme: readonly(isNightTheme),

	userSettings: readonly(userSettings),
	baseProfile: readonly(baseProfile),
	expandSettings: readonly(expandSettings),
	screenProfile: readonly(screenProfile),
	activeProfile: readonly(activeProfile),

	// Getters
	getCurrentTheme,
	getScreenSettings,
	getScreenProfile,
	getScreenType,
	getScreenColor,
	getFormattedScreenName,
	shouldPreventServerSync,
	getTransitionTime: () => get(transitionTime),

	// Setters
	setCurrentScreen,
	setLocalMode,
	setCurrentTheme,
	setMonitorEnabled,
	toggleDayNightMode,
	updateSharedSettings,
	updateEditingProfile,
	normalizeScreenSettings,
	resetSettings,
	updateSettings,
	setExpandSettings,
	toggleExpandSettings
}
