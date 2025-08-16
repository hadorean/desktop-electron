import { derived, get, writable } from 'svelte/store'

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

// Get the initial value from server data or environment variable
const initial = ((): { url: string; hasServerProvidedUrl: boolean } => {
	if (typeof window !== 'undefined') {
		// First check if server provided URL via template injection
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const serverData = (window as any).__SERVER_DATA__
		if (serverData?.serverUrl) {
			console.log('🔌 Using server-provided URL:', serverData.serverUrl)
			return { url: serverData.serverUrl, hasServerProvidedUrl: true }
		}
	}
	const envUrl = import.meta.env.VITE_API_BASE_URL || ''
	console.log('🔌 Using environment URL:', envUrl)
	return { url: envUrl, hasServerProvidedUrl: false }
})()

const configEnabled = writable(false)
const baseUrl = writable(initial.url)
const effectiveUrl = derived([baseUrl, configEnabled], ([baseUrl, configEnabled]) => {
	if (!!baseUrl || configEnabled) {
		return baseUrl
	} else {
		const envUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
		return envUrl
	}
})

export const apiStore = {
	configEnabled: derived(configEnabled, x => x),
	url: derived(effectiveUrl, url => url),

	setServerUrl: (newUrl: string): void => {
		console.log('🔄 Updating server URL to:', newUrl)
		baseUrl.set(newUrl)
	},

	setConfigEnabled: (enabled: boolean): void => {
		configEnabled.set(enabled)
	},

	getUrl: (): string => get(effectiveUrl)
}
