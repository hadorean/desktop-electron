import { createStore } from '$shared/utils'
import { AppContext } from '../services/app'

export const { store: isQuitting, set: setIsQuitting } = createStore<boolean>(false)
export const { store: appStore, set: setAppContext, get: getAppContext } = createStore<AppContext | null>(null)
