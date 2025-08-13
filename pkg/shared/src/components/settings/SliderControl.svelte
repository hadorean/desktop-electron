<script lang="ts">
	import { Slider } from '../ui'
	import { Button } from '../ui'

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
		overrideValue = null,
		disabled = false
	} = $props<{
		label: string
		value: number | null
		min: number
		max: number
		step?: number
		onChange: (value: number | null) => void
		formatValue: (value: number) => string
		isOverride?: boolean
		defaultValue: number
		overrideValue?: number | null
		disabled?: boolean
	}>()

	const isOverridden = $derived(isOverride && overrideValue !== null)
	const isGhost = $derived(isOverride && !isOverridden)

	function handleOverride(): void {
		if (disabled) return

		console.log(`[SliderControl ${label}] handleOverride called:`, {
			isOverridden,
			overrideValue
		})
		if (!isOverridden) {
			// When enabling override, use either the defaultValue or the current shared value
			const newValue = defaultValue ?? value ?? min
			onChange(newValue)
		} else {
			// When disabling override, set to null to use shared value
			onChange(null)
		}
	}

	function handleValueChange(newValues: number[]): void {
		if (disabled) return

		const newValue = newValues[0]
		console.log(`[SliderControl ${label}] handleValueChange called:`, {
			newValue,
			previous: value
		})
		onChange(newValue)
	}

	const currentValue = $derived(value ?? defaultValue)
	const displayValue = $derived(isOverridden ? (overrideValue ?? min) : currentValue)
</script>

<div class="slider-control" class:disabled>
	<label class="slider-label">
		<span class="label-text">{label}</span>
		<div class="slider-row">
			{#if isOverride}
				<Button 
					variant={isOverridden ? 'default' : 'ghost'} 
					size="sm" 
					class="override-btn" 
					onclick={handleOverride} 
					{disabled}
				>
					{isOverridden ? 'Clear' : 'Override'}
				</Button>
			{/if}
			<Slider
				value={[displayValue]}
				{min}
				{max}
				{step}
				onValueChange={handleValueChange}
				class="slider-control-input {isGhost ? 'ghost-slider' : ''} {disabled ? 'disabled-slider' : ''}"
				{disabled}
			/>
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
		color: var(--text-primary);
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
		color: var(--text-secondary);
	}

	/* Override button styling */
	:global(.override-btn) {
		height: 2rem;
		padding: 0 0.75rem;
		font-size: 0.75rem;
		line-height: 1;
	}

	/* Slider control input styling */
	:global(.slider-control-input) {
		flex: 1;
	}

	/* Ghost mode styling */
	:global(.ghost-slider) {
		opacity: 0.5;
		transition: opacity 0.2s ease;
	}

	:global(.ghost-slider:hover) {
		opacity: 0.7;
	}

	/* Ghost styling for our custom slider classes */
	:global(.ghost-slider .slider-track) {
		background-color: transparent !important;
		border: 1px solid var(--border) !important;
	}

	:global(.ghost-slider .slider-progress) {
		background-color: transparent !important;
		border: 1px solid var(--border) !important;
	}

	/* Ghost styling for slider thumb */
	:global(.ghost-slider .slider-thumb) {
		background-color: transparent !important;
		border: 1px solid var(--border) !important;
		box-shadow: none !important;
	}

	:global(.ghost-slider .slider-thumb:hover) {
		background-color: var(--surface-hover) !important;
	}

	/* Disabled styling */
	.slider-control.disabled {
		opacity: 0.5;
		pointer-events: none;
	}

	:global(.disabled-slider) {
		opacity: 0.5;
		pointer-events: none;
	}
</style>
