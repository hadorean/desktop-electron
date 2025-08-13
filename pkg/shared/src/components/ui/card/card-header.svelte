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

<div class="card-header {className || ''}" {...restProps}>
	{@render children?.()}
</div>

<style>
	.card-header {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 1.5rem;
	}
</style>
