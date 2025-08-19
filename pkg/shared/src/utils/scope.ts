export type Unsubscriber = () => void

export type Callback<T> = ((value: T) => void) | ((value: T) => Promise<void>) | (() => void) | (() => Promise<void>)

export interface Subscribable<T> {
	subscribe: (callback: Callback<T>) => Unsubscriber
}

export class Scope {
	private unsubscribers: Unsubscriber[] = []

	subscribe<T>(source: Subscribable<T>, callback: Callback<T>): Unsubscriber {
		const unsubscribe = source.subscribe(callback)
		this.unsubscribers.push(unsubscribe)
		return () => {
			this.unsubscribers.splice(this.unsubscribers.indexOf(unsubscribe), 1)
			unsubscribe()
		}
	}

	cleanup() {
		this.unsubscribers.forEach(unsubscribe => unsubscribe())
		this.unsubscribers = []
	}
}

export function subscribeNext<T>(source: Subscribable<T>, callback: Callback<T>): Unsubscriber {
	let initialized = false
	const action = (value: T) => {
		if (!initialized) return
		callback(value)
	}

	return source.subscribe(action)
}

export const when = (sources: Subscribable<unknown>[], callback: () => void) => {
	const unsubscribers: Unsubscriber[] = []

	let initialized = false

	const action = () => {
		if (!initialized) return
		callback()
	}

	sources.forEach(source => {
		unsubscribers.push(source.subscribe(action))
	})

	initialized = true
	callback()

	return () => {
		unsubscribers.forEach(unsubscribe => unsubscribe())
	}
}
