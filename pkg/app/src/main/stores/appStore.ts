import { createStore } from '$shared/utils'
import { LocalServer } from '../server'
import { BackgroundManager } from '../windows/backgrounds.svelte'
import { MainWindow } from '../windows/mainWindow'

export const { store: isQuitting, set: setIsQuitting } = createStore<boolean>(false)
export const { store: mainWindow, set: setMainWindow, get: getMainWindow } = createStore<MainWindow | null>(null)
export const { store: localServer, set: setLocalServer, get: getLocalServer } = createStore<LocalServer | null>(null)
export const { store: bg, set: setBg, get: getBg } = createStore<BackgroundManager | null>(null)
