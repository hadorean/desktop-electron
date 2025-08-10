// Settings type definitions

export type SettingsButtonPosition = 'bottom-right' | 'top-right' | 'bottom-left' | 'top-left';

export interface UISettings {
	selectedImage: string;
	opacity: number;
	blur: number;
	saturation: number;
	hideButton: boolean;
	transitionTime: number;
	showTimeDate: boolean;
	showWeather: boolean;
	showScreenSwitcher: boolean;
	favorites: string[];
	settingsButtonPosition: SettingsButtonPosition;
}

export interface ServerSettings {
	lastModified?: string; // ISO 8601 timestamp
	shared: UISettings;
	screens: Record<string, Partial<UISettings>>;
}

export interface SettingsUpdateEvent {
	type: 'settings_update';
	settings: ServerSettings;
	timestamp: number;
	clientId: string;
}

// Legacy alias for backward compatibility
/** @deprecated Use UISettings instead */
export type Settings = UISettings;

export const DEFAULT_UI_SETTINGS: UISettings = {
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
};

export const DEFAULT_SERVER_SETTINGS: ServerSettings = {
	shared: DEFAULT_UI_SETTINGS,
	screens: {}
};
