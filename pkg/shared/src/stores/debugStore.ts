import { get, writable } from 'svelte/store';
import { checkStorageAvailability } from '../utils';

export const debugVisible = writable<boolean>(getInitialDebugState());

// Helper function to get initial debug state from localStorage
function getInitialDebugState(): boolean {
	if (typeof window === 'undefined') {
		return false; // Default for SSR/Node environments
	}

	try {
		const savedState = localStorage.getItem('debug.visible');
		if (savedState !== null) {
			return JSON.parse(savedState);
		}
	} catch (error) {
		console.error('Error loading initial debug state:', error);
	}

	return false; // Default fallback
}

// Load debug state from localStorage (for manual refresh if needed)
export function loadDebugState(): void {
	if (!checkStorageAvailability()) {
		console.warn('localStorage not available, using current debug state');
		return;
	}

	try {
		const savedState = localStorage.getItem('debug.visible');
		if (savedState !== null) {
			const isVisible = JSON.parse(savedState);
			debugVisible.set(isVisible);
		}
	} catch (error) {
		console.error('Error loading debug state from localStorage:', error);
	}
}

// Save debug state to localStorage
function saveDebugState(visible: boolean): void {
	if (!checkStorageAvailability()) {
		return;
	}

	try {
		localStorage.setItem('debug.visible', JSON.stringify(visible));
	} catch (error) {
		console.error('Error saving debug state to localStorage:', error);
	}
}

// Toggle debug menu visibility
export function toggleDebugMenu(): boolean {
	debugVisible.update((current) => !current);
	return get(debugVisible);
}

export function getDebugMenuVisible(): boolean {
	return get(debugVisible);
}

// Set debug menu visibility
export function setDebugMenuVisible(visible: boolean): void {
	debugVisible.set(visible);
	// Save to localStorage for client-side persistence
	if (typeof window !== 'undefined') {
		saveDebugState(visible);
	}
}

// Subscribe to changes to automatically save state (only in browser environment)
if (typeof window !== 'undefined') {
	debugVisible.subscribe((visible) => {
		saveDebugState(visible);
	});
}
