import { readonly, writable } from 'svelte/store'

const expandSettings = writable(false)

function setExpandSettings(value: boolean): void {
	expandSettings.set(value)
}

function toggleExpandSettings(): void {
	expandSettings.update(current => !current)
}

export const uiStore = {
	expandSettings: readonly(expandSettings),
	setExpandSettings,
	toggleExpandSettings
}
