<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		children?: Snippet
		class?: string
		currentIndex?: number
	}

	let { children, class: className = '', currentIndex = 0, ...restProps }: Props = $props()

	let transformStyle = $derived(`translateX(${-currentIndex * 100}%)`)
</script>

<div class="carousel-content {className}" style="transform: {transformStyle}" {...restProps}>
	{@render children?.()}
</div>

<style>
	.carousel-content {
		display: flex;
		height: 100%;
		transition: transform 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
	}
</style>
