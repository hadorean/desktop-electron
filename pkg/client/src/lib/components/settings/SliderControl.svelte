<script lang="ts">
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

	function handleChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const newValue = parseFloat(target.value);
		console.log(`[SliderControl ${label}] handleChange called:`, {
			newValue,
			previous: value
		});
		onChange(newValue);
	}
</script>

<div class="slider form-control">
	<label class="label">
		<span class="label-text">{label}</span>
		<div class="row">
			{#if isOverride}
				<button
					class="btn btn-xs {isOverridden ? 'btn-primary' : 'btn-ghost'}"
					onclick={handleOverride}
				>
					{isOverridden ? 'Clear' : 'Override'}
				</button>
			{/if}
			<input
				type="range"
				class="range range-primary"
				{min}
				{max}
				{step}
				value={value ?? defaultValue}
				oninput={handleChange}
				class:ghost={isOverride && !isOverridden}
			/>
			<span class="w-12 text-right">
				{#if isOverridden}
					{formatValue(overrideValue ?? min)}
				{:else}
					{formatValue(value ?? defaultValue)}
				{/if}
			</span>
		</div>
	</label>
</div>

<style>
	.label {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
	}

	.row {
		display: flex;
		width: 100%;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.range {
		width: 100%;
	}

	input[type='range'] {
		--size: 16px;
		--ghost-color-bg: rgba(46, 46, 46, 0.2);
		--ghost-color-track-bg: rgba(127, 127, 127, 0);
		--ghost-border: 1px solid rgba(127, 127, 127, 0.288);
	}

	input[type='range'].range-primary {
		height: var(--size) !important;
	}

	input[type='range'].ghost.range-primary {
		--range-shdw: 0%;
	}

	input[type='range']::-moz-range-thumb {
		height: var(--size) !important;
		width: var(--size) !important;
		border: none !important;
		outline: none !important;
		background: none !important;
	}

	input[type='range']::-webkit-slider-thumb {
		height: var(--size) !important;
		width: var(--size) !important;
	}

	input[type='range'].ghost::-webkit-slider-thumb {
		background-color: var(--ghost-color-bg) !important;
		border: var(--ghost-border) !important;
	}

	input[type='range'].ghost::-moz-range-thumb {
		background-color: var(--ghost-color-bg) !important;
		border: var(--ghost-border) !important;
		border: var(--ghost-border) !important;
		height: calc(var(--size) * 0.9) !important;
		width: calc(var(--size) * 0.9) !important;
	}

	input[type='range'].ghost::-webkit-slider-runnable-track {
		background-color: var(--ghost-color-track-bg) !important;
		border: var(--ghost-border) !important;
	}

	input[type='range'].ghost.range-primary::-moz-range-track {
		background-color: var(--ghost-color-track-bg) !important;
		border: var(--ghost-border) !important;
	}
</style>
