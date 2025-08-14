import { get, writable } from 'svelte/store'
import { socketService } from '../services/socket'

// Create a store for the API configuration toggle
export const apiConfigEnabled = writable(false)

// Get the initial value from server data or environment variable
const getInitialApiUrl = (): string => {
	if (typeof window !== 'undefined') {
		// First check if server provided URL via template injection
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const serverData = (window as any).__SERVER_DATA__
		if (serverData?.serverUrl) {
			console.log('🔌 Using server-provided URL:', serverData.serverUrl)
			return serverData.serverUrl
		}
	}
	const envUrl = import.meta.env.VITE_API_BASE_URL || ''
	console.log('🔌 Using environment URL:', envUrl)
	return envUrl
}

// Create a store for the API URL
export const apiBaseUrl = writable(getInitialApiUrl())

// Create a derived store for the effective API URL
export const effectiveApiUrl = writable(getInitialApiUrl())

// Update effective URL when either store changes
apiConfigEnabled.subscribe((enabled) => {
	if (enabled) {
		effectiveApiUrl.set(get(apiBaseUrl))
	} else {
		effectiveApiUrl.set(import.meta.env.VITE_API_BASE_URL || '')
	}
})

apiBaseUrl.subscribe((value) => {
	if (get(apiConfigEnabled)) {
		effectiveApiUrl.set(value)
	}
})

// Reinitialize socket when effective URL changes
effectiveApiUrl.subscribe((url) => {
	if (typeof window !== 'undefined' && url) {
		console.log('🔌 API URL changed, reinitializing socket:', url)
		socketService.reinitialize()
	}
})

// Initialize screen settings from server data (defer until settings are loaded)
if (typeof window !== 'undefined') {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const serverData = (window as any).__SERVER_DATA__
	if (serverData?.screenId) {
		console.log('🖥️  Screen ID detected from server:', serverData.screenId)
		// Store the screen ID to be used after settings load
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		;(window as any).__INITIAL_SCREEN_ID__ = serverData.screenId
	}
}
