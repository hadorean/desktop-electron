import { settingsStore } from '$shared/stores'

export function setScreenFromRoute(path: string): void {
	console.log('Parsing route params: ', path)

	// Route format: /app/:userId/:screenId or /:userId/:screenId
	const parts = path.replace(/^\/+/, '').split('/')

	// Handle /app/userId/screenId format
	if (parts.length >= 2 && parts[0] === 'app') {
		settingsStore.setCurrentScreen(parts[1] || '')
	}

	// Handle /userId/screenId format
	else if (parts.length >= 1) {
		settingsStore.setCurrentScreen(parts[1] || '')
	}

	// Handle single parameter case (unlikely but included for completeness)
	else if (parts.length === 1 && parts[0]) {
		settingsStore.setCurrentScreen(parts[0] || '')
	}
}
