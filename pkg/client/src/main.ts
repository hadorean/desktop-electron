import '@hgrandry/dbg/styles.css'
import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import { setScreenFromRoute } from './init'

setScreenFromRoute(window.location.pathname)

const app = mount(App, {
	target: document.getElementById('app')!
})

export default app
