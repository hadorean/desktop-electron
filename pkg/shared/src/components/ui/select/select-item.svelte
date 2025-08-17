<script lang="ts">
	import { Check as CheckIcon } from 'lucide-svelte'
	import { Select as SelectPrimitive } from 'bits-ui'
	import { cn, type WithoutChild } from '../../../lib/utils'

	let {
		ref = $bindable(null),
		class: className,
		value,
		label,
		children: childrenProp,
		...restProps
	}: WithoutChild<SelectPrimitive.ItemProps> = $props()
</script>

<SelectPrimitive.Item bind:ref {value} data-slot="select-item" class={cn('select-item', className)} {...restProps}>
	{#snippet children({ selected, highlighted })}
		<span class="check-container">
			{#if selected}
				<CheckIcon class="check-icon" />
			{/if}
		</span>
		{#if childrenProp}
			{@render childrenProp({ selected, highlighted })}
		{:else}
			{label || value}
		{/if}
	{/snippet}
</SelectPrimitive.Item>

<style>
	.select-item {
		position: relative;
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: flex-start;
		gap: 0.5rem;
		border-radius: calc(var(--radius) - 2px);
		padding: 0.375rem 0.5rem 0.375rem 0.5rem;
		padding-right: 2rem;
		font-size: 0.875rem;
		line-height: 1.25rem;
		user-select: none;
		cursor: default;
		outline: none;
		text-align: left;
	}

	.select-item[data-highlighted] {
		background: hsl(var(--accent));
		color: hsl(var(--accent-foreground));
	}

	.select-item[data-disabled] {
		pointer-events: none;
		opacity: 0.5;
	}

	.check-container {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		display: flex;
		width: 1rem;
		height: 1rem;
		align-items: center;
		justify-content: center;
	}

	.check-icon {
		width: 0.875rem;
		height: 0.875rem;
	}

	:global(.select-item svg:not(.check-icon)) {
		width: 1rem;
		height: 1rem;
		pointer-events: none;
		flex-shrink: 0;
	}

	:global(.select-item svg:not([class*='text-'])) {
		color: hsl(var(--muted-foreground));
	}
</style>
