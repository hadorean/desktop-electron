<script lang="ts">
	let {
		class: className,
		children,
		...restProps
	} = $props<{
		class?: string
		children?: import('svelte').Snippet
		[key: string]: unknown
	}>()
</script>

<div class="card-content {className || ''}" {...restProps}>
	{@render children?.()}
</div>

<style>
	.card-content {
		padding: 1.5rem;
		padding-top: 0;
	}
</style>
