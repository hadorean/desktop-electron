// Settings type definitions

export type DayNightMode = 'day' | 'night'
export type SettingsButtonPosition = 'bottom-right' | 'top-right' | 'bottom-left' | 'top-left'
export type ScreenType = 'static' | 'interactive'
export const colors = ['#90A0A7', 'rgb(0, 139, 204)', '#f0b71b', '#1ec735', '#e02828', '#7b16f0', '#d933fa', '#11e4b6']

export interface ScreenProfile {
	selectedImage: string
	mode: 'image' | 'url'
	url: string
	opacity: number
	blur: number
	saturation: number
	hideButton: boolean
	transitionTime: number
	showTimeDate: boolean
	showWeather: boolean
	showScreenSwitcher: boolean
	favorites: string[]
	settingsButtonPosition: SettingsButtonPosition
}

export interface ScreenSettings {
	day: Partial<ScreenProfile>
	night: Partial<ScreenProfile> | null
}

export function getThemeScreenSettings(
	settings: ScreenSettings | undefined,
	theme: DayNightMode
): Partial<ScreenProfile> {
	if (!settings) {
		return DefaultScreenSettings.day
	}
	return theme === 'day' || settings.night === null ? settings.day : { ...settings.day, ...settings.night }
}

export function getThemeEditingSettings(
	settings: ScreenSettings | undefined,
	theme: DayNightMode
): Partial<ScreenProfile> {
	if (!settings) {
		return {}
	}
	return theme === 'day' ? settings.day : (settings.night ?? {})
}

export interface UserSettings {
	lastModified?: string // ISO 8601 timestamp
	currentTheme: DayNightMode
	shared: ScreenSettings
	screens: Record<string, ScreenSettings>
}

export interface SettingsUpdateEvent {
	type: 'settings_update'
	settings: UserSettings
	timestamp: number
	clientId: string
}

export const DefaultScreenProfile: ScreenProfile = {
	selectedImage: '',
	mode: 'image',
	url: '',
	opacity: 1,
	blur: 0,
	saturation: 1,
	hideButton: false,
	transitionTime: 1,
	showTimeDate: true,
	showWeather: false,
	showScreenSwitcher: true,
	favorites: [],
	settingsButtonPosition: 'bottom-right'
}

export const DefaultScreenSettings: ScreenSettings = {
	day: {},
	night: null
}

export const DefaultUserSettings: UserSettings = {
	currentTheme: 'day',
	shared: DefaultScreenSettings,
	screens: {}
}
