import type { Callback, Unsubscriber } from './scope'

// Read-only signal
export interface ISignal<T> {
	subscribe(callback: Callback<T>): Unsubscriber
	add(callback: (payload: T) => void): this
	once(callback: (payload: T) => void): this
	remove(callback: (payload: T) => void): this
}

export class Signal<T> implements ISignal<T> {
	private slots: Array<(payload: T) => void> = []
	private onces: Array<(payload: T) => void> = []

	subscribe(callback: Callback<T>): Unsubscriber {
		this.add(callback)
		return () => this.remove(callback)
	}

	add(callback: (payload: T) => void): this {
		this.slots.push(callback)
		return this
	}

	once(callback: (payload: T) => void): this {
		this.onces.push(callback)
		return this
	}

	remove(callback: Callback<T>): this {
		this.slots = this.slots.filter(item => item !== callback)
		this.onces = this.onces.filter(item => item !== callback)
		return this
	}

	emit(payload: T): void {
		this.notify(this.slots, payload)
		this.notify(this.onces, payload)
		this.onces = []
	}

	/**
	 * Use reverse loop with implicit comparison for better performance.
	 * @see http://jsbench.github.io/#174d623c29798680e44b867dcf9732e7
	 */
	private notify(slots: Array<(payload: T) => void>, payload: T): void {
		for (let i = slots.length; i--; ) {
			const callback = slots[i]
			callback.call(callback, payload)
		}
	}
}

export class SignalVoid extends Signal<void> {
	emit(): void {
		super.emit(undefined)
	}
}
