<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		children?: Snippet
		class?: string
	}

	let { children, class: className = '', ...restProps }: Props = $props()
</script>

<div class="carousel-item {className}" {...restProps}>
	{@render children?.()}
</div>

<style>
	.carousel-item {
		height: 100%;
		min-width: 100%;
		flex-shrink: 0;
	}
</style>
