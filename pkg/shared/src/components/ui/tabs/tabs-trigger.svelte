<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui'

	let { class: className, value, disabled = false, ...restProps }: TabsPrimitive.TriggerProps = $props()
</script>

<TabsPrimitive.Trigger {value} {disabled} data-slot="tabs-trigger" class={className} {...restProps} />

<style>
	:global([data-slot='tabs-trigger']) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		white-space: nowrap;
		border-radius: var(--radius-sm);
		padding: 0.25rem 0.75rem;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.15s ease-in-out;
		background: transparent;
		border: none;
		cursor: pointer;
		color: var(--muted-foreground);
	}

	:global([data-slot='tabs-trigger']:focus-visible) {
		outline: none;
		box-shadow:
			0 0 0 2px var(--background),
			0 0 0 4px var(--ring);
	}

	:global([data-slot='tabs-trigger'][data-state='active']) {
		background-color: var(--background);
		color: var(--foreground);
		box-shadow: var(--shadow-sm);
	}

	:global([data-slot='tabs-trigger']:disabled) {
		pointer-events: none;
		opacity: 0.5;
	}
</style>
