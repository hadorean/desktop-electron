// Settings type definitions

export const defaultScreenId = 'monitor1'
export const defaultColor = '#90A0A7'
export const imageBackground = null

export type DayNightMode = 'day' | 'night'
export type SettingsButtonPosition = 'bottom-right' | 'top-right' | 'bottom-left' | 'top-left'
export type ScreenType = 'static' | 'interactive'
export type BackgroundMode = typeof imageBackground | 'url'

export const colors = [
	defaultColor,
	'rgb(0, 139, 204)',
	'#f0b71b',
	'#1ec735',
	'#e02828',
	'#7b16f0',
	'#d933fa',
	'#11e4b6'
]

export interface ScreenProfile {
	image: string
	mode: BackgroundMode // default is image
	url: string
	brightness: number
	blur: number
	saturation: number
	hideButton: boolean
	transitionTime: number
	showTimeDate: boolean
	showWeather: boolean
}

export interface ScreenSettings {
	day: Partial<ScreenProfile>
	night: Partial<ScreenProfile> | null
	monitorIndex: number | null
	monitorEnabled: boolean
}

export function getProfile(settings: ScreenSettings | undefined, theme: DayNightMode): Partial<ScreenProfile> {
	if (!settings) {
		return DefaultScreenSettings.day
	}
	return theme === 'day' ? settings.day : (settings.night ?? {})
}

export interface UserSettings {
	lastModified?: string // ISO 8601 timestamp
	currentTheme: DayNightMode
	shared: ScreenSettings
	screens: Record<string, ScreenSettings>
	favorites: string[]
}

export interface SettingsUpdateEvent {
	type: 'settings_update'
	settings: UserSettings
	timestamp: number
	clientId: string
}

export const DefaultScreenProfile: ScreenProfile = {
	image: '',
	mode: imageBackground,
	url: '',
	brightness: 1,
	blur: 0,
	saturation: 1,
	hideButton: false,
	transitionTime: 1,
	showTimeDate: true,
	showWeather: false
}

export const DefaultScreenSettings: ScreenSettings = {
	day: {},
	night: null,
	monitorIndex: null,
	monitorEnabled: true
}

export const DefaultUserSettings: UserSettings = {
	currentTheme: 'day',
	shared: DefaultScreenSettings,
	screens: {},
	favorites: []
}
