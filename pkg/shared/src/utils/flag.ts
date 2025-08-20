export class ScopedFlag implements Disposable {
	private startValue: boolean = false
	private setter: (value: boolean) => void

	constructor(setter: (value: boolean) => void, startValue: boolean = true) {
		this.startValue = startValue
		this.setter = setter
		this.setter(startValue)
	}

	[Symbol.dispose]() {
		console.log('Disposing!')
		this.setter(!this.startValue)
	}
}

export class Ref<T> {
	private value: T

	constructor(value: T) {
		this.value = value
	}

	get(): T {
		return this.value
	}

	set(value: T): void {
		this.value = value
	}
}

export class Flag {
	private value: boolean = false

	turn(): boolean {
		if (this.value) return false
		this.value = true
		return true
	}
}
