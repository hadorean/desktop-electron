<script lang="ts">
	import { Easing, Tween } from '@tweenjs/tween.js'
	import type { Snippet } from 'svelte'
	import { onMount } from 'svelte'
	import { get } from 'svelte/store'
	import { settingsStore } from '../../stores/settingsStore'
	import { when } from '../../utils/scope'
	import { Tweener } from '../../utils/tweens'

	const { tweener, children } = $props<{ tweener: Tweener; children: Snippet }>()

	type EffectState = {
		value: number
		tween: Tween | null
	}

	let blur = $state<EffectState>({ value: 0, tween: null })
	let saturation = $state<EffectState>({ value: 1, tween: null })
	let brightness = $state<EffectState>({ value: 1, tween: null })
	let imageScale = $derived(1 + (blur.value ?? 0) * 0.003)

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
		}
	})
</script>

<div
	class="image-filter"
	style="scale: {imageScale}; opacity: {brightness.value}; filter: {blur.value > 0
		? `blur(${blur.value}px)`
		: null} saturate({saturation.value});"
>
	{@render children?.()}
</div>

<style>
	.image-filter {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
</style>
