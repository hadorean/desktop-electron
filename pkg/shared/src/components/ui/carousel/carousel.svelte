<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		children?: Snippet
		class?: string
		currentIndex?: number
		onIndexChange?: (index: number) => void
	}

	let { children, class: className = '', onIndexChange, ...restProps }: Props = $props()

	let carouselRef: HTMLDivElement

	export function goToSlide(index: number): void {
		if (onIndexChange) {
			onIndexChange(index)
		}
	}
</script>

<div bind:this={carouselRef} class="carousel {className}" {...restProps}>
	{@render children?.()}
</div>

<style>
	.carousel {
		position: relative;
		height: 100%;
		width: 100%;
		overflow: hidden;
	}
</style>
