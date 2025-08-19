<script lang="ts">
	import { settingsStore } from '../../stores/settingsStore'
	import type { TransitionSettings } from '../../types/settings'
	import { Icon, Slider } from '../ui'

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
		disabled = false,
		transition = 0,
		getTransition
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
		transition?: number
		getTransition: (settings: TransitionSettings) => number
	}>()

	const { currentScreenColor } = settingsStore

	const isOverridden = $derived(isOverride && overrideValue !== null)
	const isGhost = $derived(isOverride && !isOverridden)
	const currentValue = $derived(value ?? defaultValue)
	const displayValue = $derived(isOverridden ? (overrideValue ?? min) : currentValue)
	const canRevert = $derived(isOverridden || displayValue !== defaultValue)

	let currentTransition = $state(transition)
	settingsStore.transition.subscribe(t => {
		currentTransition = getTransition(t)
	})

	function handleRevert(): void {
		if (disabled || !canRevert) return

		if (isOverridden) {
			// In override mode, turn off the override
			onChange(null)
		} else {
			// Reset to default value with animation
			onChange(defaultValue)
		}
	}

	function handleValueChange(newValues: number[]): void {
		//console.log('handleValueChange', newValues)
		currentTransition = 0
		if (currentTransition) return

		const newValue = newValues[0]
		onChange(newValue)
	}
</script>

<div class="slider-control" class:disabled>
	<div class="slider-row">
		<span class="label-text">{label}</span>
		<button
			class="revert-button"
			class:disabled={disabled || !canRevert}
			onclick={handleRevert}
			title={isOverridden ? 'Clear override' : 'Reset to default'}
			aria-label={isOverridden ? 'Clear override' : 'Reset to default'}
		>
			<Icon name="revert" size="sm" />
		</button>
		<div class="slider-wrapper" style="--slider-color: {$currentScreenColor}">
			<Slider
				transition={currentTransition}
				value={[displayValue]}
				{min}
				{max}
				{step}
				onValueChange={handleValueChange}
				class="slider-control-input {isGhost ? 'ghost-slider' : ''} {isOverridden ? 'override-slider' : ''} {disabled
					? 'disabled-slider'
					: ''}"
				{disabled}
			/>
		</div>
		<span class="value-display">
			{formatValue(displayValue)}
		</span>
	</div>
</div>

<style>
	.slider-control {
		width: 100%;
	}

	.slider-row {
		display: flex;
		width: 100%;
		flex-direction: row;
		align-items: center;
		gap: 0.75rem;
	}

	.label-text {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
		min-width: 5rem;
		flex-shrink: 0;
	}

	.revert-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border: none;
		border-radius: 0.25rem;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.revert-button:hover:not(.disabled) {
		background: var(--surface-hover);
		color: var(--text-primary);
		transform: scale(1.1);
	}

	.revert-button.disabled {
		opacity: 0.3;
		cursor: not-allowed;
		pointer-events: none;
	}

	.value-display {
		min-width: 3rem;
		text-align: right;
		font-size: 0.875rem;
		color: var(--text-secondary);
		flex-shrink: 0;
	}

	.slider-wrapper {
		flex: 1;
	}

	/* Slider control input styling */

	/* Override mode styling - make more visible */
	:global(.override-slider) {
		opacity: 1 !important;
	}

	:global(.override-slider .slider-track) {
		background-color: rgba(255, 255, 255, 0.2) !important;
		border: 1px solid var(--slider-color, var(--primary)) !important;
		/* transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important; */
	}

	:global(.override-slider .slider-progress) {
		background-color: var(--slider-color, var(--primary)) !important;
		box-shadow: 0 0 8px rgba(var(--slider-color, var(--primary)), 0.3) !important;
		/* transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important; */
	}

	:global(.override-slider .slider-thumb) {
		background-color: var(--slider-color, var(--primary)) !important;
		border: 2px solid white !important;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
		scale: 1.1;
		/* transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important; */
	}

	/* Ghost mode styling */
	:global(.ghost-slider) {
		--border-color: rgb(165, 165, 165);
		opacity: 0.5;
		transition: opacity 0.2s ease;
	}

	:global(.ghost-slider:hover) {
		opacity: 0.7;
	}

	:global(.ghost-slider .slider-track) {
		background-color: transparent !important;
		border: 1px solid var(--border-color) !important;
	}

	:global(.ghost-slider .slider-progress) {
		background-color: transparent !important;
		border: 1px solid var(--border-color) !important;
	}

	:global(.ghost-slider .slider-thumb) {
		background-color: transparent !important;
		border: 1px solid var(--border-color) !important;
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
