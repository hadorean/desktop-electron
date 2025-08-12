import { get, writable } from 'svelte/store'
import { AppContext } from '../services/app'

export const appStore = writable<AppContext | null>(null)

export function setAppContext(context: AppContext): void {
	appStore.set(context)
}

export function getAppContext(): AppContext | null {
	return get(appStore)
}
