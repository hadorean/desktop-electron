type Unsubscriber = () => void

type Callback<T> = (value: T) => void | (() => void)

type Subscribable<T> = {
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
