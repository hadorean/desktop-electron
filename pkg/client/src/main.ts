import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import { setCurrentScreen } from '../../shared/src/stores/settingsStore'
import '@hgrandry/dbg/styles.css'

const path = window.location.pathname
setScreenFromRoute(path)

const app = mount(App, {
	target: document.getElementById('app')!
})

export default app

function setScreenFromRoute(path: string): void {
	console.log('Parsing route params: ', path)

	// Route format: /app/:userId/:screenId or /:userId/:screenId
	const parts = path.replace(/^\/+/, '').split('/')

	// Handle /app/userId/screenId format
	if (parts.length >= 2 && parts[0] === 'app') {
		setCurrentScreen(parts[1] || '')
	}
	// Handle /userId/screenId format
	else if (parts.length >= 1) {
		setCurrentScreen(parts[1] || '')
	}
	// Handle single parameter case (unlikely but included for completeness)
	else if (parts.length === 1 && parts[0]) {
		setCurrentScreen(parts[0] || '')
	}
}
