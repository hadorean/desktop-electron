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

<div class="card {className || ''}" {...restProps}>
	{@render children?.()}
</div>

<style>
	.card {
		background-color: var(--card);
		color: var(--card-foreground);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
		box-shadow: var(--shadow-sm);
	}
</style>
