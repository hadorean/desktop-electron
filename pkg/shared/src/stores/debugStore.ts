import { get, writable } from 'svelte/store'

// Debug visibility store - initial state loading is now handled by localStorage service
export const debugVisible = writable<boolean>(false)

// Load debug state - now handled by localStorage service
export function loadDebugState(): void {
	console.warn('debugStore.loadDebugState() is deprecated. Initialize localStorageService instead.')
}

// Save debug state - now handled by localStorage service
// This function is kept for backward compatibility but does nothing
function saveDebugState(visible: boolean): void {
	// Saving is now handled automatically by localStorage service
	// This function is deprecated
}

// Toggle debug menu visibility
export function toggleDebugMenu(): boolean {
	debugVisible.update((current) => !current)
	return get(debugVisible)
}

export function getDebugMenuVisible(): boolean {
	return get(debugVisible)
}

// Set debug menu visibility
export function setDebugMenuVisible(visible: boolean): void {
	debugVisible.set(visible)
	// Saving to localStorage is now handled automatically by localStorage service
}

// Automatic saving is now handled by localStorage service
