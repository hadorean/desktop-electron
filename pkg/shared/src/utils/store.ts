import { get, readonly, writable } from 'svelte/store'

// Utility to create store with getter, setter, and updater
export const createStore = <T>(initial: T) => {
	const store = writable<T>(initial)
	return {
		store: readonly(store),
		get: () => get(store),
		set: (value: T) => store.set(value),
		update: (fn: (value: T) => T) => store.update(fn)
	}
}

// Usage

// Readonly store
// const { store: isTrue, set: setIsTrue } = createStore<boolean>(false)

// Writable store
// const { store: myType, set: setMyType, get: getMyType } = createStore<MyType | null>(null)
