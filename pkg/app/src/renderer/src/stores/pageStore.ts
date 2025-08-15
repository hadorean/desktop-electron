// Page management store for the renderer app
import { createStore } from '$shared'

type Page = 'main' | 'options'

// Store for current page state
export const { store: currentPage, get: getCurrentPage, set: gotoPage } = createStore<Page>('main')
