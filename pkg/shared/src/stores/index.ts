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
	updateLocalSettings,
	resetSettings,
	getScreenSettings,
	type Settings as StoreSettings,
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
