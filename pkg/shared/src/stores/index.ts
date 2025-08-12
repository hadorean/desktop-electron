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
export { debugVisible, loadDebugState, setDebugMenuVisible, toggleDebugMenu } from './debugStore'

// Images store
export {
	clearImages,
	getCurrentImages,
	getFallbackImageName,
	getIsLoadingImages,
	hasImages,
	imageExists,
	images,
	imagesError,
	imagesLastUpdated,
	imagesLoading,
	imagesState,
	isImagesLoading,
	loadImages,
	onImagesChanged,
	refreshImages,
	updateImages
} from './imagesStore'

// API store
export { effectiveApiUrl } from './apiStore'
