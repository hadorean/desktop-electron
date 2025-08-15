import { createStore } from '../utils'

const visible = createStore<boolean>(false)

export const debugMenu = new (class DebugMenu {
	public visibility = visible.store

	get isVisible(): boolean {
		return visible.get()
	}

	setVisible(value: boolean) {
		visible.set(value)
	}

	updateVisible(callback: (value: boolean) => boolean) {
		visible.update(callback)
	}

	toggle(): boolean {
		visible.update(current => !current)
		return visible.get()
	}
})()
