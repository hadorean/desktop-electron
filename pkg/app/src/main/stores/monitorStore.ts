import { readonly, writable } from 'svelte/store'

const monitors = writable<Record<string, boolean>>({})

export const monitorStore = {
	monitors: readonly(monitors),
	updateMonitors: (newMonitors: Record<string, boolean>) => {
		monitors.set(newMonitors)
	}
}
