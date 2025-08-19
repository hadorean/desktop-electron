import { derived, get, readonly, writable } from 'svelte/store'
import {
	colors,
	defaultColor,
	defaultScreenId,
	DefaultScreenProfile,
	DefaultScreenSettings,
	DefaultTransitionSettings,
	DefaultUserSettings,
	getProfile,
	type DayNightMode,
	type ScreenProfile,
	type ScreenSettings,
	type ScreenType,
	type TransitionSettings,
	type UserSettings
} from '../types'
import { when } from '../utils/scope'

const currentScreenId = writable(defaultScreenId)

const isLocalMode = writable(false)

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
	return isLocal ? { ...DefaultScreenProfile, ...getProfile(all.shared, theme) } : DefaultScreenProfile
})

// Active profile for the settings panel
const activeProfile = derived(
	[userSettings, currentScreenId, currentTheme, isLocalMode],
	([all, screen, theme, isLocal]) => {
		return isLocal ? getProfile(all.screens[screen] ?? DefaultScreenSettings, theme) : getProfile(all.shared, theme)
	}
)

// Merged profile for the current screen
const screenProfile = derived([activeProfile, baseProfile], ([active, base]) => {
	return {
		...base,
		...active
	} as ScreenProfile
})

const currentScreen = derived([userSettings, currentScreenId, isLocalMode], ([all, screenId, isLocal]) => {
	return isLocal ? (all.screens[screenId] ?? DefaultScreenSettings) : all.shared
})

const makeTransition = (time: number): TransitionSettings => {
	return {
		blur: time,
		brightness: time,
		saturation: time,
		transitionTime: time
	}
}

const transitionSettings = writable<TransitionSettings>(DefaultTransitionSettings)

const transitionOverride = writable<Partial<TransitionSettings>>({})

const currentTransition = derived([transitionSettings, transitionOverride], ([settings, override]) => {
	return { ...settings, ...override } as TransitionSettings
})

const renderSettings = derived([userSettings, currentTransition], ([settings, transition]) => {
	return { settings, transition }
})

when([currentScreenId, currentTheme], () => {
	transitionOverride.set(makeTransition(get(screenProfile).transitionTime))
})

const updateTransition = (key: keyof TransitionSettings, value: number): void => {
	if (get(transitionOverride)[key] == value) return
	transitionOverride.update(current => ({ ...current, [key]: value }))
}

const currentScreenColor = derived(
	[userSettings, currentScreenId, isLocalMode],
	([$userSettings, $currentScreenId, $isLocalMode]) => {
		if (!$isLocalMode) {
			// Shared/home screen uses default color
			return defaultColor
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

function setDefaultImage(image: string): void {
	userSettings.update(value => ({
		...value,
		shared: {
			...value.shared,
			day: { ...value.shared.day, image }
		}
	}))
}

function updateFavorites(modifier: (favorites: string[]) => string[]): void {
	userSettings.update(value => ({
		...value,
		favorites: modifier(value.favorites)
	}))
}

/**
 * Update settings for the current context (shared or local screen+theme)
 * This function handles the day/night logic and null checks automatically
 */
function updateProfile(modifier: (current: Partial<ScreenProfile>) => Partial<ScreenProfile>): void {
	const theme = getCurrentTheme()
	const editedProfile = get(activeProfile)
	const settings = get(currentScreen)
	const updatedProfile = modifier(editedProfile)

	// If night mode and no overrides exist, don't create night settings
	if (theme === 'night' && settings.night === null && Object.keys(updatedProfile).length === 0) {
		return
	}

	if (get(isLocalMode)) {
		// Update local screen settings for current theme
		const screenId = get(currentScreenId) || defaultScreenId

		userSettings.update(value => {
			return {
				...value,
				screens: {
					...value.screens,
					[screenId]: {
						...settings,
						[theme]: updatedProfile
					}
				}
			}
		})
	} else {
		userSettings.update(value => {
			return {
				...value,
				shared: {
					...settings,
					[theme]: updatedProfile
				}
			}
		})
	}
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

	isLocalMode: readonly(isLocalMode),
	isNightTheme: readonly(isNightTheme),

	userSettings: readonly(userSettings),
	baseProfile: readonly(baseProfile),
	screenProfile: readonly(screenProfile),
	activeProfile: readonly(activeProfile),

	transition: readonly(currentTransition),
	renderSettings: readonly(renderSettings),
	updateTransition,

	// Getters
	getCurrentTheme,
	getScreenSettings,
	getScreenProfile,
	getScreenType,
	getScreenColor,
	getFormattedScreenName,

	// Setters

	setCurrentScreen,
	setLocalMode,
	setCurrentTheme,
	setMonitorEnabled,
	setDefaultImage,

	toggleDayNightMode,

	updateFavorites,
	updateProfile,
	updateSettings,

	resetSettings
}
