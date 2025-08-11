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

// Screen store
export {
	routeParams,
	currentScreen as currentScreenStore,
	hasValidParams,
	defaultScreenId,
	setRouteParams,
	setCurrentScreen,
	setCurrentUser,
	getCurrentParams,
	parseRouteParams,
	getRouteUrl,
	ScreenStoreManager,
	initializeScreenStore,
	getScreenStoreManager,
	type RouteParams,
	type ScreenAdapter
} from './screenStore'

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
