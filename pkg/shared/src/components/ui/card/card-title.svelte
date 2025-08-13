<script lang="ts">
	import type { Snippet } from 'svelte'

	let {
		class: className,
		children,
		...restProps
	} = $props<{
		class?: string
		children?: Snippet
		[key: string]: unknown
	}>()
</script>

<h3 class="card-title {className || ''}" {...restProps}>
	{@render children?.()}
</h3>

<style>
	.card-title {
		font-size: 1.5rem;
		font-weight: 600;
		line-height: 1;
		letter-spacing: -0.025em;
		color: var(--card-foreground);
	}
</style>
