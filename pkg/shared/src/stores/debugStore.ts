import { get, writable } from 'svelte/store'

// Debug visibility store - initial state loading is now handled by localStorage service
export const debugVisible = writable<boolean>(false)

// Load debug state - now handled by localStorage service
export function loadDebugState(): void {
	console.warn('debugStore.loadDebugState() is deprecated. Initialize localStorageService instead.')
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
}
