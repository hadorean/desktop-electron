<script lang="ts">
	import type { Snippet } from 'svelte'
	import { quartOut } from 'svelte/easing'
	import { currentPage as currentPageStore } from '../stores/pageStore'

	interface Props {
		settingsContent?: Snippet
		optionsContent?: Snippet
		transparent?: boolean
		class?: string
		duration?: number
		easing?: (t: number) => number
	}

	let { settingsContent, optionsContent, class: className = '', duration = 300, easing = quartOut, ...restProps }: Props = $props()

	// Track previous page to determine slide direction
	let previousPage = $state<string | null>(null)

	$effect(() => {
		if (previousPage !== null && previousPage !== $currentPageStore) {
			// Page changed
		}
		previousPage = $currentPageStore
	})

	// Custom slide transition that moves full width + fade
	function slideTransition(node: Element, { direction, duration = 500 }: { direction: 'from-left' | 'from-right'; duration?: number }) {
		const style = getComputedStyle(node)
		const opacity = +style.opacity
		const width = node.clientWidth

		// If coming from right, start off-screen to the right (+width)
		// If coming from left, start off-screen to the left (-width)
		const startX = direction === 'from-right' ? width : -width

		return {
			duration,
			easing, // More dramatic easing with slight overshoot
			css: (t: number) => {
				const x = startX * (1 - t)
				const fadeOpacity = opacity * t
				return `
					transform: translateX(${x}px);
					opacity: ${fadeOpacity};
				`
			}
		}
	}

	// Exit transition - slide out in opposite direction
	function slideOutTransition(node: Element, { direction, duration = 400 }: { direction: 'to-left' | 'to-right'; duration?: number }) {
		const style = getComputedStyle(node)
		const opacity = +style.opacity
		const width = node.clientWidth

		// If going to left, end off-screen to the left (-width)
		// If going to right, end off-screen to the right (+width)
		const endX = direction === 'to-left' ? -width : width

		return {
			duration,
			easing, // Smooth deceleration for exit
			css: (t: number) => {
				const x = endX * (1 - t)
				const fadeOpacity = opacity * t
				return `
					transform: translateX(${x}px);
					opacity: ${fadeOpacity};
				`
			}
		}
	}
</script>

<div class="simple-page-container {className}" {...restProps}>
	{#if $currentPageStore === 'main'}
		<div
			class="page-content"
			in:slideTransition={{ direction: 'from-left', duration: duration }}
			out:slideOutTransition={{ direction: 'to-left', duration: duration }}
		>
			{@render settingsContent?.()}
		</div>
	{:else if $currentPageStore === 'options'}
		<div
			class="page-content"
			in:slideTransition={{ direction: 'from-right', duration: duration }}
			out:slideOutTransition={{ direction: 'to-right', duration: duration }}
		>
			{@render optionsContent?.()}
		</div>
	{/if}
</div>

<style>
	.simple-page-container {
		position: relative;
		height: 100%;
		width: 100%;
		overflow: hidden; /* Prevent scrollbars during slide animation */
	}

	.page-content {
		height: 100%;
		width: 100%;
		position: absolute;
		top: 0;
		left: 0;
	}
</style>
