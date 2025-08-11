<script lang="ts">
	import { onMount } from 'svelte'
	import { screenSettings } from '$shared/stores/settingsStore'
	import { getImageUrl } from '$shared/services/api'
	import { Tween, Easing } from '@tweenjs/tween.js'

	interface ImageState {
		url: string
		tween: Tween | null
		opacity: number
	}

	let activeImage: ImageState | null = null
	let imageStack: ImageState[] = []
	let currentImageUrl = ''
	let animationFrameId: number | null = null
	let imageScale = 1

	// Subscribe to settings store for image changes
	$: {
		const selectedImage = $screenSettings.selectedImage ?? ''
		const imageUrl = getImageUrl(selectedImage)
		if (imageUrl !== currentImageUrl) {
			currentImageUrl = imageUrl
			startTransition()
		}

		imageScale = 1 + ($screenSettings.blur ?? 0) * 0.003
	}

	function startTransition(): void {
		if (!currentImageUrl) return

		// If we have an active image, move it to the stack and start fading it out
		if (activeImage) {
			const previousImage = activeImage
			imageStack = [...imageStack, previousImage]
			previousImage.tween?.stop()

			previousImage.tween = new Tween({ opacity: previousImage.opacity })
				.to({ opacity: 0 }, ($screenSettings.transitionTime ?? 1) * 1000)
				.easing(Easing.Quadratic.Out)
				.onUpdate((value) => {
					if (previousImage) {
						previousImage.opacity = value.opacity
						if (value.opacity <= 0) {
							// Remove from stack when fully transparent
							imageStack = imageStack.filter((img) => img !== previousImage)
							previousImage.tween?.stop()
							previousImage.tween = null
						}
					}
				})
				.start()
		}

		// Set new image as active and start fading in
		activeImage = {
			url: currentImageUrl,
			opacity: 0,
			tween: null
		}

		activeImage.tween = new Tween({ opacity: 0 })
			.to({ opacity: 1 }, ($screenSettings.transitionTime ?? 1) * 1000)
			.easing(Easing.Quadratic.Out)
			.onUpdate((value) => {
				if (activeImage) {
					activeImage.opacity = value.opacity
					if (value.opacity >= 1) {
						activeImage.tween?.stop()
						activeImage.tween = null
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

		// Update active image tween
		if (activeImage?.tween) {
			activeImage.tween.update(time)
			hasActiveTweens = true
		}

		// Update stack tweens and clean up completed ones
		imageStack = imageStack.filter((image) => {
			if (image.tween) {
				image.tween.update(time)
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
		if ($screenSettings.selectedImage) {
			currentImageUrl = getImageUrl($screenSettings.selectedImage)
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
	style="scale: {imageScale}; opacity: {$screenSettings.opacity ?? 1}; filter: {[
		($screenSettings.blur ?? 0) > 0 ? `blur(${$screenSettings.blur}px)` : null,
		`saturate(${$screenSettings.saturation ?? 1})`
	]
		.filter(Boolean)
		.join(' ')};"
>
	{#each imageStack as image (image.url)}
		<img src={image.url} alt="Background" class="background-image" style="opacity: {image.opacity};" />
	{/each}
	{#if activeImage}
		<img src={activeImage.url} alt="Background" class="background-image" style="opacity: {activeImage.opacity};" />
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
</style>
