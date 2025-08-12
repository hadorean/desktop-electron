// Settings type definitions

export type DayNightMode = 'day' | 'night'
export type SettingsButtonPosition = 'bottom-right' | 'top-right' | 'bottom-left' | 'top-left'

export interface ScreenSettings {
	selectedImage: string
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

export interface DayNightScreenSettings {
	day: Partial<ScreenSettings>
	night: Partial<ScreenSettings> | null
}

export function getThemeScreenSettings(settings: DayNightScreenSettings | undefined, theme: DayNightMode): Partial<ScreenSettings> {
	if (!settings) {
		return DefaultDayNightSettings.day
	}
	return theme === 'day' || settings.night === null ? settings.day : { ...settings.day, ...settings.night }
}

export function getThemeEditingSettings(settings: DayNightScreenSettings | undefined, theme: DayNightMode): Partial<ScreenSettings> {
	if (!settings) {
		return {}
	}
	return theme === 'day' ? settings.day : (settings.night ?? {})
}

export interface UserSettings {
	lastModified?: string // ISO 8601 timestamp
	currentTheme: DayNightMode
	shared: DayNightScreenSettings
	screens: Record<string, DayNightScreenSettings>
}

export interface SettingsUpdateEvent {
	type: 'settings_update'
	settings: UserSettings
	timestamp: number
	clientId: string
}

export const DefaultScreenSettings: ScreenSettings = {
	selectedImage: '',
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

export const DefaultDayNightSettings: DayNightScreenSettings = {
	day: {},
	night: null
}

export const DefaultUserSettings: UserSettings = {
	currentTheme: 'day',
	shared: DefaultDayNightSettings,
	screens: {}
}
