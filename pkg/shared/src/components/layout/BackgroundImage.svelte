<script lang="ts">
	import { Easing, Tween } from '@tweenjs/tween.js'
	import { onMount } from 'svelte'
	import { api } from '../../services'
	import { settingsStore } from '../../stores/settingsStore'
	import { type BackgroundMode, imageBackground } from '../../types/settings'
	import { Tweener } from '../../utils/tweens'
	import ImageFilter from './ImageFilter.svelte'

	const { screenProfile } = settingsStore

	interface BackgroundState {
		key: number
		url: string
		mode: BackgroundMode
		tween: Tween | null
		opacity: number
	}

	let backgroundStack: BackgroundState[] = $state([])
	let current: BackgroundState | null = $derived(backgroundStack[backgroundStack.length - 1] ?? null)
	let newKey = 0

	const tweener = new Tweener()

	onMount(() => {
		const mode = $screenProfile.mode
		let initialUrl = ''

		if (mode === imageBackground && $screenProfile.image) {
			initialUrl = api.getImageUrl($screenProfile.image)
		} else if (mode === 'url' && $screenProfile.url) {
			initialUrl = $screenProfile.url
		}

		if (initialUrl) {
			fadeTo(mode, initialUrl)
		}

		return () => {
			tweener.dispose()
		}
	})

	// Subscribe to settings store for background changes
	$effect(() => {
		const mode = $screenProfile.mode
		let backgroundUrl = ''

		if (mode === null) {
			const selectedImage = $screenProfile.image ?? ''
			backgroundUrl = api.getImageUrl(selectedImage)
		} else {
			backgroundUrl = $screenProfile.url ?? ''
		}

		if (backgroundUrl !== current?.url || mode !== current?.mode) {
			fadeTo(mode, backgroundUrl)
		}
	})

	function fadeTo(mode: BackgroundMode, url: string): void {
		if (!url) return

		console.log('Fade to', mode ?? 'image', url)

		// If we have an active background, move it to the stack and start fading it out
		if (current) {
			const previousBackground = current
			tweener.restart(
				previousBackground,
				new Tween({ opacity: previousBackground.opacity })
					.to({ opacity: 0 }, ($screenProfile.transitionTime ?? 1) * 1000)
					.easing(Easing.Quadratic.Out)
					.onUpdate(value => {
						if (previousBackground) {
							previousBackground.opacity = value.opacity
						}
					})
					.onComplete(() => {
						// Remove from stack when fully transparent
						backgroundStack = backgroundStack.filter(bg => bg !== previousBackground)
						tweener.stop(previousBackground)
					})
			)
		}

		// Set new background as active and start fading in
		const newBackground = {
			key: newKey++,
			url: url,
			mode: mode,
			opacity: 0,
			tween: null
		}

		backgroundStack = [...backgroundStack, newBackground]

		if (current) {
			tweener.start(
				current,
				new Tween({ opacity: 0 })
					.to({ opacity: 1 }, ($screenProfile.transitionTime ?? 1) * 1000)
					.easing(Easing.Quadratic.Out)
					.onUpdate(value => {
						if (newBackground) {
							current.opacity = value.opacity
						}
					})
					.onComplete(() => tweener.stop(current))
			)
		}
	}
</script>

<ImageFilter {tweener}>
	{#each backgroundStack as background (background.key + '-' + background.url)}
		{#if background.mode === imageBackground}
			<img src={background.url} alt="Background" class="background-image" style="opacity: {background.opacity};" />
		{:else if background.mode === 'url' && background.url}
			<iframe
				src={background.url}
				title="Background URL"
				class="background-iframe"
				style="opacity: {background.opacity};"
				sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
			></iframe>
		{/if}
	{/each}
</ImageFilter>

<style>
	.background-image {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 1;
	}

	.background-iframe {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border: none;
		opacity: 1;
		pointer-events: none;
	}
</style>
