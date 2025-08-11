<script lang="ts">
	import { Slider } from '../ui';
	import { Button } from '../ui';
	import { cn } from '../../lib/utils';

	const {
		label,
		value,
		min,
		max,
		step = 1,
		onChange,
		formatValue,
		isOverride = false,
		defaultValue = 0,
		overrideValue = null
	} = $props<{
		label: string;
		value: number | null;
		min: number;
		max: number;
		step?: number;
		onChange: (value: number | null) => void;
		formatValue: (value: number) => string;
		isOverride?: boolean;
		defaultValue: number;
		overrideValue?: number | null;
	}>();

	let renderCount = $state(0);
	const isOverridden = $derived(isOverride && overrideValue !== null);
	const isGhost = $derived(isOverride && !isOverridden);

	function handleOverride() {
		console.log(`[SliderControl ${label}] handleOverride called:`, {
			isOverridden,
			overrideValue
		});
		if (!isOverridden) {
			// When enabling override, use either the defaultValue or the current shared value
			const newValue = defaultValue ?? value ?? min;
			onChange(newValue);
		} else {
			// When disabling override, set to null to use shared value
			onChange(null);
		}
	}

	function handleValueChange(newValues: number[]) {
		const newValue = newValues[0];
		console.log(`[SliderControl ${label}] handleValueChange called:`, {
			newValue,
			previous: value
		});
		onChange(newValue);
	}

	const currentValue = $derived(value ?? defaultValue);
	const displayValue = $derived(isOverridden ? (overrideValue ?? min) : currentValue);
</script>

<div class="slider-control">
	<label class="slider-label">
		<span class="label-text">{label}</span>
		<div class="slider-row">
			{#if isOverride}
				<Button variant={isOverridden ? 'default' : 'ghost'} size="sm" class="override-btn text-xs h-8 px-3" onclick={handleOverride}>
					{isOverridden ? 'Clear' : 'Override'}
				</Button>
			{/if}
			<Slider value={[displayValue]} {min} {max} {step} onValueChange={handleValueChange} class={cn('flex-1', isGhost && 'ghost-slider')} />
			<span class="value-display">
				{formatValue(displayValue)}
			</span>
		</div>
	</label>
</div>

<style>
	.slider-control {
		width: 100%;
	}

	.slider-label {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
	}

	.label-text {
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--foreground));
	}

	.slider-row {
		display: flex;
		width: 100%;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.value-display {
		min-width: 3rem;
		text-align: right;
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
	}

	/* Ghost mode styling */
	:global(.ghost-slider) {
		opacity: 0.5;
		transition: opacity 0.2s ease;
	}

	:global(.ghost-slider:hover) {
		opacity: 0.7;
	}

	/* Ghost styling for slider track and fill */
	:global(.ghost-slider .bg-secondary) {
		background-color: transparent !important;
		border: 1px solid hsl(var(--border)) !important;
	}

	:global(.ghost-slider .bg-primary) {
		background-color: transparent !important;
		border: 1px solid hsl(var(--border)) !important;
	}

	/* Ghost styling for slider thumb */
	:global(.ghost-slider .bg-background) {
		background-color: transparent !important;
		border: 1px solid hsl(var(--border)) !important;
	}
</style>
