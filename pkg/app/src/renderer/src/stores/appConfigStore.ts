import type { AppConfig } from '$shared'
import { writable } from 'svelte/store'

export const appConfig = writable<AppConfig | null>(null)

export function setAppConfig(config: AppConfig | null): void {
	appConfig.set(config)
}
