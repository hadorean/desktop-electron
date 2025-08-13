import { mount } from 'svelte'

import '$shared/assets/app.css'
import '@hgrandry/dbg/styles.css'

import App from './App.svelte'

const app = mount(App, {
	target: document.getElementById('app')!
})

export default app
