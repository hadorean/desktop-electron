// Settings type definitions

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

export interface UserSettings {
	lastModified?: string // ISO 8601 timestamp
	shared: ScreenSettings
	screens: Record<string, Partial<ScreenSettings>>
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

export const DefaultUserSettings: UserSettings = {
	shared: DefaultScreenSettings,
	screens: {}
}
