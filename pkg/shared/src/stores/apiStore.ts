import { writable, get } from 'svelte/store';
import { socketService } from '../services/socket';

// Create a store for the API configuration toggle
export const apiConfigEnabled = writable(false);

// Get the initial value from server data, localStorage, or environment variable
const getInitialApiUrl = () => {
	if (typeof window !== 'undefined') {
		// First check if server provided URL via template injection
		const serverData = (window as any).__SERVER_DATA__;
		if (serverData?.serverUrl) {
			console.log('🔌 Using server-provided URL:', serverData.serverUrl);
			return serverData.serverUrl;
		}

		// Fallback to localStorage
		const savedUrl = localStorage.getItem('apiBaseUrl');
		if (savedUrl) {
			console.log('🔌 Using localStorage URL:', savedUrl);
			return savedUrl;
		}
	}
	const envUrl = import.meta.env.VITE_API_BASE_URL || '';
	console.log('🔌 Using environment URL:', envUrl);
	return envUrl;
};

// Create a store for the API URL
export const apiBaseUrl = writable(getInitialApiUrl());

// Create a derived store for the effective API URL
export const effectiveApiUrl = writable(getInitialApiUrl());

// Subscribe to changes and save to localStorage
if (typeof window !== 'undefined') {
	apiBaseUrl.subscribe((value) => {
		localStorage.setItem('apiBaseUrl', value);
	});
}

// Update effective URL when either store changes
apiConfigEnabled.subscribe((enabled) => {
	if (enabled) {
		effectiveApiUrl.set(get(apiBaseUrl));
	} else {
		effectiveApiUrl.set(import.meta.env.VITE_API_BASE_URL || '');
	}
});

apiBaseUrl.subscribe((value) => {
	if (get(apiConfigEnabled)) {
		effectiveApiUrl.set(value);
	}
});

// Reinitialize socket when effective URL changes
effectiveApiUrl.subscribe((url) => {
	if (typeof window !== 'undefined' && url) {
		console.log('🔌 API URL changed, reinitializing socket:', url);
		socketService.reinitialize();
	}
});
