import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { parseRouteParams } from '../../shared/src/stores/routeStore';
import '@hgrandry/dbg/styles.css';
// Parse route parameters before mounting the app
const path = window.location.pathname;
parseRouteParams(path);

const app = mount(App, {
	target: document.getElementById('app')!
});

export default app;
