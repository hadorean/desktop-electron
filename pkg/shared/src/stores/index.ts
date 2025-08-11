/**
 * Shared stores for settings and screen management
 */

// Settings store
export {
	allSettings,
	currentScreen,
	currentTheme,
	isNightMode,
	isLocalMode,
	expandSettings,
	screenIds,
	baseScreenSettings,
	screenSettings,
	baseEditingSettings,
	editingSettings,
	updateSharedSettings,
	updateSharedSettingsSilent,
	updateLocalSettings,
	updateLocalSettingsSilent,
	updateEditingSettings,
	shouldPreventServerSync,
	resetSettings,
	validateSelectedImages,
	getScreenSettings,
	getScreenDayNightSettings,
	toggleDayNightMode,
	inTransition,
	transitionSettings,
	startThemeTransition
} from './settingsStore'

// Debug store
export { debugVisible, toggleDebugMenu, setDebugMenuVisible, loadDebugState } from './debugStore'

// Images store
export {
	images,
	imagesLoading,
	imagesError,
	imagesLastUpdated,
	imagesState,
	hasImages,
	loadImages,
	refreshImages,
	clearImages,
	updateImages,
	getCurrentImages,
	isImagesLoading,
	onImagesChanged,
	getFallbackImageName,
	imageExists,
	getIsLoadingImages
} from './imagesStore'
