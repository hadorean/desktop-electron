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

const initialState: UserOptionsStoreState = {
	options: DefaultUserOptions,
	isLoading: false,
	error: null,
	lastUpdated: null
}

const state = writable<UserOptionsStoreState>(initialState)
const userOptions = derived(state, $store => $store.options)
const imageDirectory = derived(userOptions, $options => $options.imageDirectory)

/**
 * Load options from external source (will be called by service)
 */
function set(options: UserOptions, skipPreventSync = false): void {
	// Prevent sync cascades during loading, unless this is an update operation
	isLoadingOptions = true
	if (!skipPreventSync) {
		preventServerSync = true
	}

	const previousOptions = getCurrent()

	state.update(state => ({
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
function update(updater: (current: UserOptions) => UserOptions): void {
	if (isLoadingOptions) return

	const previousOptions = getCurrent()

	state.update(state => {
		const updatedOptions = updater(state.options)
		return {
			...state,
			options: updatedOptions,
			lastUpdated: Date.now()
		}
	})

	const newOptions = getCurrent()

	// Notify callbacks of options changes
	notifyOptionsChangeCallbacks(newOptions, previousOptions)
}

/**
 * Clear the store (useful for cleanup)
 */
function clear(): void {
	state.set(initialState)
}

/**
 * Get current user options synchronously (useful for imperative code)
 */
function getCurrent(): UserOptions {
	return get(userOptions)
}

/**
 * Get current image directory synchronously
 */
function getCurrentImageDirectory(): string {
	return get(imageDirectory)
}

/**
 * Register a callback to be notified when options change
 */
function onChanged(callback: OptionsChangeCallback): () => void {
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
	optionsChangeCallbacks.forEach(callback => {
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
function isPreventingSync(): boolean {
	return preventServerSync
}

// Export object with all functions for convenient importing
export const userOptionsStore = {
	// Stores
	userOptions,
	imageDirectory,

	// Setter
	set,
	update,
	clear,

	// Getter
	getCurrent,
	getCurrentImageDirectory,
	isPreventingSync,

	// Callbacks
	onChanged
}

export type UserOptionsStore = typeof userOptionsStore
