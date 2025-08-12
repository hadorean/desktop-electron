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
		border-radius: 0.375rem;
		padding: 0.25rem 0.75rem;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.15s ease-in-out;
		background: transparent;
		border: none;
		cursor: pointer;
	}

	:global([data-slot='tabs-trigger']:focus-visible) {
		outline: none;
	}

	:global([data-slot='tabs-trigger'][data-state='active']) {
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		box-shadow:
			0 1px 3px 0 rgb(0 0 0 / 0.1),
			0 1px 2px -1px rgb(0 0 0 / 0.1);
	}

	:global([data-slot='tabs-trigger']:disabled) {
		pointer-events: none;
		opacity: 0.5;
	}
</style>
