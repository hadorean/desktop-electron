// Page management store for the renderer app
import { writable } from 'svelte/store'

type Page = 'main' | 'options'

// Store for current page state
export const currentPage = writable<Page>('main')

// Navigation function
export function gotoPage(page: Page): void {
	console.log(`pageStore: Navigating to page: ${page}`)
	currentPage.set(page)
}

// Helper to get current page value (for non-reactive contexts)
export function getCurrentPageValue(): Page {
	let value: Page = 'main'
	currentPage.subscribe((v) => (value = v))()
	return value
}
