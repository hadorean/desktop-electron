import { createStore } from '../utils'

// Debug visibility store - initial state loading is now handled by localStorage service
export const { store: debugVisible, set: setDebugMenuVisible, get: getDebugMenuVisible, update } = createStore<boolean>(false)

export const toggleDebugMenu = (): boolean => {
	update((current) => !current)
	return getDebugMenuVisible()
}
