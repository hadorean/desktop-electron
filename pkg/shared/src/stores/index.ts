/**
 * Shared stores for settings and screen management
 */

// Settings store
export {
	allSettings,
	baseEditingSettings,
	baseScreenSettings,
	currentScreen,
	currentTheme,
	editingSettings,
	expandSettings,
	getScreenDayNightSettings,
	getScreenSettings,
	inTransition,
	isLocalMode,
	isNightMode,
	resetSettings,
	screenIds,
	screenSettings,
	shouldPreventServerSync,
	startThemeTransition,
	toggleDayNightMode,
	transitionSettings,
	updateEditingSettings,
	updateLocalSettings,
	updateLocalSettingsSilent,
	updateSharedSettings,
	updateSharedSettingsSilent,
	validateSelectedImages
} from './settingsStore'

// Debug store
export { debugVisible, setDebugMenuVisible, toggleDebugMenu } from './debugStore'

// Images store
export { imagesStore } from './imagesStore'

// API store
export { effectiveApiUrl } from './apiStore'

// User options store
export {
	clearUserOptions,
	getCurrentImageDirectory,
	getCurrentUserOptions,
	getIsLoadingUserOptions,
	imageDirectory,
	isUserOptionsLoading,
	loadUserOptions,
	onUserOptionsChanged,
	setUserOptionsError,
	setUserOptionsLoading,
	shouldPreventUserOptionsSync,
	updateImageDirectory,
	updateUserOptions,
	updateUserOptionsSilent,
	userOptions,
	userOptionsError,
	userOptionsLastUpdated,
	userOptionsLoading,
	userOptionsState
} from './userOptionsStore'
