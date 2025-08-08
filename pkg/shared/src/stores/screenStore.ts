import { writable, derived } from 'svelte/store';

export const defaultScreenId = 'default';

// Define the route parameters interface
export interface RouteParams {
	userId: string; // A string identifying the user
	screenId: string; // A string identifier for the screen
}

// Create a writable store for route parameters
export const routeParams = writable<RouteParams>({
	userId: '',
	screenId: defaultScreenId
});

// Current screen being edited/viewed
export const currentScreen = writable(defaultScreenId);

// Create a derived store to check if both params are valid
export const hasValidParams = derived(routeParams, (params) => {
	// Check if userId is not empty
	const isValidUserId = Boolean(params.userId && params.userId.trim().length > 0);
	// Check if screenId is not empty
	const isValidScreenId = Boolean(params.screenId && params.screenId.trim().length > 0);

	return isValidUserId && isValidScreenId;
});

/**
 * Update route parameters
 */
export function setRouteParams(userId: string, screenId: string): void {
	routeParams.set({ userId, screenId });
	currentScreen.set(screenId);
}

/**
 * Update just the screen ID
 */
export function setCurrentScreen(screenId: string): void {
	currentScreen.set(screenId);
	routeParams.update(params => ({ ...params, screenId }));
}

/**
 * Update just the user ID
 */
export function setCurrentUser(userId: string): void {
	routeParams.update(params => ({ ...params, userId }));
}

/**
 * Get current route parameters
 */
export function getCurrentParams(): RouteParams {
	let params: RouteParams = { userId: '', screenId: defaultScreenId };
	const unsubscribe = routeParams.subscribe(p => params = p);
	unsubscribe();
	return params;
}

/**
 * Function to parse and set route parameters from URL (client-specific)
 */
export function parseRouteParams(path: string): void {
	console.log('Parsing route params: ', path);

	// Route format: /app/:userId/:screenId or /:userId/:screenId
	const parts = path.replace(/^\/+/, '').split('/');

	// Handle /app/userId/screenId format
	if (parts.length >= 3 && parts[0] === 'app') {
		setRouteParams(parts[1] || '', parts[2] || defaultScreenId);
	}
	// Handle /userId/screenId format
	else if (parts.length >= 2) {
		setRouteParams(parts[0] || '', parts[1] || defaultScreenId);
	}
	// Handle single parameter case (unlikely but included for completeness)
	else if (parts.length === 1 && parts[0]) {
		routeParams.update(params => ({ ...params, userId: parts[0] }));
	}
}

/**
 * Function to get URL from params (client-specific)
 */
export function getRouteUrl(params: RouteParams): string {
	return `/app/${params.userId}/${params.screenId}`;
}

// Screen store manager for environment-specific functionality
export interface ScreenAdapter {
	saveCurrentScreen?(screenId: string): void;
	loadCurrentScreen?(): Promise<string>;
}

export class ScreenStoreManager {
	private adapter: ScreenAdapter | null = null;

	constructor(adapter?: ScreenAdapter) {
		if (adapter) {
			this.setAdapter(adapter);
		}
	}

	/**
	 * Set the screen adapter for this environment
	 */
	setAdapter(adapter: ScreenAdapter): void {
		this.adapter = adapter;
		this.setupSubscriptions();
	}

	/**
	 * Initialize screen store by loading saved screen
	 */
	async initialize(): Promise<void> {
		if (this.adapter?.loadCurrentScreen) {
			try {
				const savedScreen = await this.adapter.loadCurrentScreen();
				if (savedScreen) {
					setCurrentScreen(savedScreen);
				}
			} catch (error) {
				console.error('Failed to load saved screen:', error);
			}
		}
	}

	/**
	 * Set up subscriptions to save changes through adapter
	 */
	private setupSubscriptions(): void {
		if (!this.adapter?.saveCurrentScreen) return;

		currentScreen.subscribe((screenId) => {
			this.adapter?.saveCurrentScreen?.(screenId);
		});
	}
}

// Default store manager instance
let defaultScreenManager: ScreenStoreManager | null = null;

/**
 * Initialize the default screen store manager with adapter
 */
export function initializeScreenStore(adapter?: ScreenAdapter): ScreenStoreManager {
	defaultScreenManager = new ScreenStoreManager(adapter);
	return defaultScreenManager;
}

/**
 * Get the default screen store manager instance
 */
export function getScreenStoreManager(): ScreenStoreManager {
	if (!defaultScreenManager) {
		// Create default manager without adapter if not initialized
		defaultScreenManager = new ScreenStoreManager();
	}
	return defaultScreenManager;
}