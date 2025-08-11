/**
 * Shared stores for settings and screen management
 */

// Settings store
export {
	allSettings,
	currentScreen,
	isLocalMode,
	expandSettings,
	screenIds,
	sharedSettings,
	localSettings,
	settings,
	hasLocalSettings,
	updateSharedSettings,
	updateSharedSettingsSilent,
	updateLocalSettings,
	updateLocalSettingsSilent,
	shouldPreventServerSync,
	resetSettings,
	validateSelectedImages,
	getScreenSettings,
	type SettingsButtonPosition
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
