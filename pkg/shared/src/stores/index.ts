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
	screenSettings,
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
	toggleDayNightMode
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
