<script lang="ts">
	import { Easing, Tween } from '@tweenjs/tween.js'
	import { onMount } from 'svelte'
	import { get } from 'svelte/store'
	import { api } from '../../services'
	import { settingsStore } from '../../stores/settingsStore'
	import { type BackgroundMode, imageBackground } from '../../types/settings'
	import { when } from '../../utils/scope'
	import { Tweener } from '../../utils/tweens'

	const { screenProfile } = settingsStore

	interface BackgroundState {
		url: string
		mode: BackgroundMode
		tween: Tween | null
		opacity: number
	}

	let activeBackground: BackgroundState | null = $state(null)
	let backgroundStack: BackgroundState[] = $state([])
	let currentBackgroundUrl = $state('')
	let currentMode: BackgroundMode = $state(imageBackground)
	let animationFrameId: number | null = $state(null)
	let effectTween: Tween | null = $state(null)

	type EffectState = {
		value: number
		tween: Tween | null
	}

	let blur = $state<EffectState>({ value: 0, tween: null })
	let saturation = $state<EffectState>({ value: 1, tween: null })
	let brightness = $state<EffectState>({ value: 1, tween: null })
	let imageScale = $derived(1 + (blur.value ?? 0) * 0.003)

	const tweener = new Tweener()

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

		if (backgroundUrl !== currentBackgroundUrl || mode !== currentMode) {
			currentBackgroundUrl = backgroundUrl
			currentMode = mode
			startTransition()
		}
	})

	const updateProp = (target: number, prop: EffectState, duration: number) => {
		if (target != prop.value) {
			if (duration == 0) {
				tweener.stop(prop)
				prop.value = target
				return
			}
			tweener.restart(
				prop,
				new Tween({ value: prop.value })
					.to({ value: target }, (duration ?? 1) * 1000)
					.easing(Easing.Quadratic.Out)
					.onUpdate(x => {
						prop.value = x.value
						if (x.value === target) {
							tweener.stop(blur)
						}
					})
			)
		}
	}

	onMount(() => {
		const unsubscribe = when([settingsStore.screenProfile, settingsStore.transition], () => {
			const screenProfile = get(settingsStore.screenProfile)
			const transition = get(settingsStore.transition)

			updateProp(screenProfile.blur, blur, transition.blur)
			updateProp(screenProfile.saturation, saturation, transition.saturation)
			updateProp(screenProfile.brightness, brightness, transition.brightness)
		})
		return () => {
			unsubscribe()
			tweener.dispose()
		}
	})

	function startTransition(): void {
		if (!currentBackgroundUrl) return

		// If we have an active background, move it to the stack and start fading it out
		if (activeBackground) {
			const previousBackground = activeBackground
			backgroundStack = [...backgroundStack, previousBackground]

			tweener.restart(
				previousBackground,
				new Tween({ opacity: previousBackground.opacity })
					.to({ opacity: 0 }, ($screenProfile.transitionTime ?? 1) * 1000)
					.easing(Easing.Quadratic.Out)
					.onUpdate(value => {
						if (previousBackground) {
							previousBackground.opacity = value.opacity
							if (value.opacity <= 0) {
								// Remove from stack when fully transparent
								backgroundStack = backgroundStack.filter(bg => bg !== previousBackground)
								tweener.stop(previousBackground)
							}
						}
					})
			)
		}

		// Set new background as active and start fading in
		activeBackground = {
			url: currentBackgroundUrl,
			mode: currentMode,
			opacity: 0,
			tween: null
		}

		tweener.start(
			activeBackground,
			new Tween({ opacity: 0 })
				.to({ opacity: 1 }, ($screenProfile.transitionTime ?? 1) * 1000)
				.easing(Easing.Quadratic.Out)
				.onUpdate(value => {
					if (activeBackground) {
						activeBackground.opacity = value.opacity
						if (value.opacity >= 1) {
							tweener.stop(activeBackground)
						}
					}
				})
		)
	}

	onMount(() => {
		const mode = $screenProfile.mode
		let initialUrl = ''

		if (mode === imageBackground && $screenProfile.image) {
			initialUrl = api.getImageUrl($screenProfile.image)
		} else if (mode === 'url' && $screenProfile.url) {
			initialUrl = $screenProfile.url
		}

		if (initialUrl) {
			currentBackgroundUrl = initialUrl
			currentMode = mode
			startTransition()
		}

		return () => {
			if (animationFrameId !== null) {
				cancelAnimationFrame(animationFrameId)
			}
		}
	})
</script>

<div
	class="background-container"
	style="scale: {imageScale}; opacity: {brightness.value}; filter: {blur.value > 0
		? `blur(${blur.value}px)`
		: null} saturate({saturation.value});"
>
	{#each backgroundStack as background (background.url + background.mode)}
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
	{#if activeBackground}
		{#if activeBackground.mode === imageBackground}
			<img
				src={activeBackground.url}
				alt="Background"
				class="background-image"
				style="opacity: {activeBackground.opacity};"
			/>
		{:else if activeBackground.mode === 'url' && activeBackground.url}
			<iframe
				src={activeBackground.url}
				title="Background URL"
				class="background-iframe"
				style="opacity: {activeBackground.opacity};"
				sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
			></iframe>
		{/if}
	{/if}
</div>

<style>
	.background-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}

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
		pointer-events: none; /* Prevent interaction with iframe content */
	}
</style>
