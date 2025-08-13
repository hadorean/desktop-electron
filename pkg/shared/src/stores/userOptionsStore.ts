/**
 * Reactive store for managing user options across the application
 */
import { derived, get, writable } from 'svelte/store'
import { DefaultUserOptions, type UserOptions } from '../types'

// Internal store state
interface UserOptionsStoreState {
	options: UserOptions
	isLoading: boolean
	error: string | null
	lastUpdated: number | null
}

// Callback type for options change notifications
type OptionsChangeCallback = (newOptions: UserOptions, previousOptions: UserOptions) => void

// Array to store callbacks
const optionsChangeCallbacks: OptionsChangeCallback[] = []

// Flag to prevent sync cascades during loading
let isLoadingOptions = false

// Flag to prevent server sync during internal operations
let preventServerSync = false

// Initial state
const initialState: UserOptionsStoreState = {
	options: DefaultUserOptions,
	isLoading: false,
	error: null,
	lastUpdated: null
}

// Create the main store
const userOptionsStoreInternal = writable<UserOptionsStoreState>(initialState)

/**
 * Load options from external source (will be called by service)
 */
export function loadUserOptions(options: UserOptions, skipPreventSync = false): void {
	// Prevent sync cascades during loading, unless this is an update operation
	isLoadingOptions = true
	if (!skipPreventSync) {
		preventServerSync = true
	}

	const previousOptions = getCurrentUserOptions()

	userOptionsStoreInternal.update((state) => ({
		...state,
		options,
		isLoading: false,
		error: null,
		lastUpdated: Date.now()
	}))

	// Reset flags after loading
	isLoadingOptions = false
	// Use setTimeout to ensure all synchronous updates complete before allowing sync
	if (!skipPreventSync) {
		setTimeout(() => {
			preventServerSync = false
		}, 0)
	}

	// Notify callbacks of options changes
	notifyOptionsChangeCallbacks(options, previousOptions)
}

/**
 * Update user options
 */
export function updateUserOptions(updater: (current: UserOptions) => UserOptions): void {
	if (isLoadingOptions) return

	const previousOptions = getCurrentUserOptions()

	userOptionsStoreInternal.update((state) => {
		const updatedOptions = updater(state.options)
		return {
			...state,
			options: updatedOptions,
			lastUpdated: Date.now()
		}
	})

	const newOptions = getCurrentUserOptions()

	// Notify callbacks of options changes
	notifyOptionsChangeCallbacks(newOptions, previousOptions)
}

/**
 * Update user options without triggering sync (for internal operations)
 */
export function updateUserOptionsSilent(updater: (current: UserOptions) => UserOptions): void {
	preventServerSync = true
	try {
		updateUserOptions(updater)
	} finally {
		// Reset flag after a microtask to ensure all synchronous effects complete
		Promise.resolve().then(() => {
			preventServerSync = false
		})
	}
}

/**
 * Set loading state
 */
export function setUserOptionsLoading(loading: boolean): void {
	userOptionsStoreInternal.update((state) => ({
		...state,
		isLoading: loading
	}))
}

/**
 * Set error state
 */
export function setUserOptionsError(error: string | null): void {
	userOptionsStoreInternal.update((state) => ({
		...state,
		error,
		isLoading: false
	}))
}

/**
 * Clear the store (useful for cleanup)
 */
export function clearUserOptions(): void {
	userOptionsStoreInternal.set(initialState)
}

// Derived stores for convenient access
export const userOptions = derived(userOptionsStoreInternal, ($store) => $store.options)
export const userOptionsLoading = derived(userOptionsStoreInternal, ($store) => $store.isLoading)
export const userOptionsError = derived(userOptionsStoreInternal, ($store) => $store.error)
export const userOptionsLastUpdated = derived(userOptionsStoreInternal, ($store) => $store.lastUpdated)

// Specific derived stores for individual options
export const imageDirectory = derived(userOptions, ($options) => $options.imageDirectory)

// Combined derived store for components that need multiple values
export const userOptionsState = derived(userOptionsStoreInternal, ($store) => $store)

/**
 * Get current user options synchronously (useful for imperative code)
 */
export function getCurrentUserOptions(): UserOptions {
	return get(userOptions)
}

/**
 * Get current image directory synchronously
 */
export function getCurrentImageDirectory(): string {
	return get(imageDirectory)
}

/**
 * Get current loading state synchronously
 */
export function isUserOptionsLoading(): boolean {
	return get(userOptionsLoading)
}

/**
 * Register a callback to be notified when options change
 */
export function onUserOptionsChanged(callback: OptionsChangeCallback): () => void {
	optionsChangeCallbacks.push(callback)

	// Return unsubscribe function
	return () => {
		const index = optionsChangeCallbacks.indexOf(callback)
		if (index > -1) {
			optionsChangeCallbacks.splice(index, 1)
		}
	}
}

/**
 * Notify all registered callbacks about options changes
 */
function notifyOptionsChangeCallbacks(newOptions: UserOptions, previousOptions: UserOptions): void {
	optionsChangeCallbacks.forEach((callback) => {
		try {
			callback(newOptions, previousOptions)
		} catch (error) {
			console.error('🔧 Error in options change callback:', error)
		}
	})
}

/**
 * Check if server sync should be prevented (for service components)
 */
export function shouldPreventUserOptionsSync(): boolean {
	return preventServerSync
}

/**
 * Check if we're currently loading options (to prevent cascades)
 */
export function getIsLoadingUserOptions(): boolean {
	return isLoadingOptions
}

/**
 * Update image directory specifically
 */
export function updateImageDirectory(directory: string): void {
	updateUserOptions((current) => ({
		...current,
		imageDirectory: directory
	}))
}

// Export object with all functions for convenient importing
export const userOptionsStore = {
	// Core functions
	loadUserOptions,
	updateUserOptions,
	updateUserOptionsSilent,
	setUserOptionsLoading,
	setUserOptionsError,
	clearUserOptions,

	// Getter functions
	getCurrentUserOptions,
	getCurrentImageDirectory,
	isUserOptionsLoading,
	shouldPreventUserOptionsSync,
	getIsLoadingUserOptions,

	// Callback management
	onUserOptionsChanged,

	// Specific update functions
	updateImageDirectory,

	// Stores
	userOptions,
	userOptionsLoading,
	userOptionsError,
	userOptionsLastUpdated,
	imageDirectory,
	userOptionsState
}

export type UserOptionsStore = typeof userOptionsStore
