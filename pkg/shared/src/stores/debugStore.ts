import { createStore } from '../utils'

const visible = createStore<boolean>(false)

export const debugMenu = {
	visibility: visible.store,

	getVisible: (): boolean => visible.get(),

	setVisible: (value: boolean): void => visible.set(value),

	toggle: (): boolean => {
		visible.update(current => !current)
		return visible.get()
	}
}
