/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{html,js,svelte,ts}', '../shared/src/**/*.{svelte,js,ts}'],
	theme: {
		extend: {}
	},
	plugins: [
		// DaisyUI plugin
		require('daisyui')
	],
	daisyui: {
		themes: ['light', 'dark', 'night'],
		darkTheme: 'night'
	}
};
