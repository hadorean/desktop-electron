<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui'

	let { ref = $bindable(null), class: className, ...restProps }: TabsPrimitive.ListProps = $props()
</script>

<TabsPrimitive.List bind:ref data-slot="tabs-list" class="tabs-list {className || ''}" {...restProps} />

<style>
	:global(.tabs-list) {
		background-color: var(--muted);
		color: var(--muted-foreground);
		display: inline-flex;
		height: 2.25rem;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-lg);
		padding: 0.25rem;
	}
</style>
