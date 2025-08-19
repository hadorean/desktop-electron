<script lang="ts">
	import { Easing, Tween } from '@tweenjs/tween.js'
	import { onMount } from 'svelte'
	import { api } from '../../services'
	import { settingsStore } from '../../stores/settingsStore'
	import { type BackgroundMode, imageBackground } from '../../types/settings'

	const { screenProfile } = settingsStore

	interface BackgroundState {
		url: string
		mode: BackgroundMode
		tween: Tween | null
		opacity: number
	}

	let activeBackground: BackgroundState | null = null
	let backgroundStack: BackgroundState[] = []
	let currentBackgroundUrl = ''
	let currentMode: BackgroundMode = imageBackground
	let animationFrameId: number | null = null
	let imageScale = 1

	// Subscribe to settings store for background changes
	$: {
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

		imageScale = 1 + ($screenProfile.blur ?? 0) * 0.003
	}

	function startTransition(): void {
		if (!currentBackgroundUrl) return

		// If we have an active background, move it to the stack and start fading it out
		if (activeBackground) {
			const previousBackground = activeBackground
			backgroundStack = [...backgroundStack, previousBackground]
			previousBackground.tween?.stop()

			previousBackground.tween = new Tween({ opacity: previousBackground.opacity })
				.to({ opacity: 0 }, ($screenProfile.transitionTime ?? 1) * 1000)
				.easing(Easing.Quadratic.Out)
				.onUpdate(value => {
					if (previousBackground) {
						previousBackground.opacity = value.opacity
						if (value.opacity <= 0) {
							// Remove from stack when fully transparent
							backgroundStack = backgroundStack.filter(bg => bg !== previousBackground)
							previousBackground.tween?.stop()
							previousBackground.tween = null
						}
					}
				})
				.start()
		}

		// Set new background as active and start fading in
		activeBackground = {
			url: currentBackgroundUrl,
			mode: currentMode,
			opacity: 0,
			tween: null
		}

		activeBackground.tween = new Tween({ opacity: 0 })
			.to({ opacity: 1 }, ($screenProfile.transitionTime ?? 1) * 1000)
			.easing(Easing.Quadratic.Out)
			.onUpdate(value => {
				if (activeBackground) {
					activeBackground.opacity = value.opacity
					if (value.opacity >= 1) {
						activeBackground.tween?.stop()
						activeBackground.tween = null
					}
				}
			})
			.start()

		if (animationFrameId === null) {
			animationFrameId = requestAnimationFrame(animate)
		}
	}

	function animate(time: number): void {
		let hasActiveTweens = false

		// Update active background tween
		if (activeBackground?.tween) {
			activeBackground.tween.update(time)
			hasActiveTweens = true
		}

		// Update stack tweens and clean up completed ones
		backgroundStack = backgroundStack.filter(background => {
			if (background.tween) {
				background.tween.update(time)
				hasActiveTweens = true
				return true
			}
			return false
		})

		if (hasActiveTweens) {
			animationFrameId = requestAnimationFrame(animate)
		} else {
			animationFrameId = null
		}
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
	style="scale: {imageScale}; opacity: {$screenProfile.brightness ?? 1}; filter: {[
		($screenProfile.blur ?? 0) > 0 ? `blur(${$screenProfile.blur}px)` : null,
		`saturate(${$screenProfile.saturation ?? 1})`
	]
		.filter(Boolean)
		.join(' ')};"
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
