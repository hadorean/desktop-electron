import { createStore, type AppConfig } from '$shared'

export const { store: appConfig, set: setAppConfig } = createStore<AppConfig | null>(null)
