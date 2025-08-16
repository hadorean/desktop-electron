<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui'
	import { ChevronDown as ChevronDownIcon } from 'lucide-svelte'
	import { cn, type WithoutChild } from '../../../lib/utils'

	let {
		ref = $bindable(null),
		class: className,
		children,
		size = 'default',
		...restProps
	}: WithoutChild<SelectPrimitive.TriggerProps> & {
		size?: 'sm' | 'default'
	} = $props()
</script>

<SelectPrimitive.Trigger bind:ref data-slot="select-trigger" data-size={size} class={cn('select-trigger', className)} {...restProps}>
	{@render children?.()}
	<ChevronDownIcon class="chevron-icon" />
</SelectPrimitive.Trigger>

<style>
	.select-trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius);
		border: 1px solid hsl(var(--border));
		background: transparent;
		color: hsl(var(--foreground));
		font-size: 0.875rem;
		line-height: 1.25rem;
		white-space: nowrap;
		user-select: none;
		outline: none;
		transition:
			color 0.2s,
			box-shadow 0.2s;
		cursor: pointer;
	}

	.select-trigger:hover {
		background: hsl(var(--accent));
	}

	.select-trigger:focus-visible {
		border-color: hsl(var(--ring));
		box-shadow: 0 0 0 3px hsl(var(--ring) / 0.5);
	}

	.select-trigger:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.select-trigger[data-size='default'] {
		height: 2.25rem;
	}

	.select-trigger[data-size='sm'] {
		height: 2rem;
	}

	.select-trigger[data-placeholder] {
		color: hsl(var(--muted-foreground));
	}

	.select-trigger[aria-invalid='true'] {
		border-color: hsl(var(--destructive));
		box-shadow: 0 0 0 1px hsl(var(--destructive) / 0.2);
	}

	.chevron-icon {
		width: 1rem;
		height: 1rem;
		opacity: 0.5;
		pointer-events: none;
		flex-shrink: 0;
		margin-left: auto;
	}

	:global(.select-trigger svg:not(.chevron-icon)) {
		width: 1rem;
		height: 1rem;
		pointer-events: none;
		flex-shrink: 0;
	}

	:global(.select-trigger svg:not([class*='text-'])) {
		color: hsl(var(--muted-foreground));
	}

	:global(.select-trigger [data-slot='select-value']) {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
