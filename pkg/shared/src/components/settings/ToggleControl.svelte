<script lang="ts">
	import { Switch, Icon } from '../ui'
	import { cn } from '../../lib/utils'
	import { currentScreenColor } from '../../stores/settingsStore'

	const {
		label,
		checked,
		onChange,
		isOverride = false,
		overrideValue = null,
		disabled = false
	} = $props<{
		label: string
		checked: boolean | null
		onChange: (value: boolean | null) => void
		defaultValue?: boolean | null
		isOverride?: boolean
		overrideValue?: boolean | null
		disabled?: boolean
	}>()

	const isOverridden = $derived(isOverride && overrideValue !== null)
	const isGhost = $derived(isOverride && !isOverridden)
	const displayChecked = $derived(isOverridden ? (overrideValue ?? false) : (checked ?? false))
	const canRevert = $derived(isOverridden)

	function handleRevert(): void {
		if (disabled || !canRevert) return

		// In override mode, turn off the override
		onChange(null)
	}

	function handleToggleChange(newChecked: boolean): void {
		if (disabled) return

		onChange(newChecked)
	}
</script>

<div class="toggle-control" class:disabled>
	<div class="toggle-row">
		<span class="label-text">{label}</span>
		{#if isOverride && canRevert}
			<button class="revert-button" class:disabled onclick={handleRevert} title="Clear override" aria-label="Clear override">
				<Icon name="revert" size="sm" />
			</button>
		{:else}
			<div class="revert-spacer"></div>
		{/if}
		<div class="switch-wrapper" style="--toggle-color: {$currentScreenColor}">
			<Switch
				id={`toggle-${label}`}
				checked={displayChecked}
				onCheckedChange={handleToggleChange}
				class={cn('switch-element', isGhost && 'ghost-toggle', isOverridden && 'override-toggle', disabled && 'disabled-toggle')}
				{disabled}
			/>
		</div>
	</div>
</div>

<style>
	.toggle-control {
		width: 100%;
	}

	.toggle-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0.75rem;
	}

	.label-text {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--foreground);
		flex: 1;
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

	.revert-spacer {
		width: 1.5rem;
		height: 1.5rem;
		flex-shrink: 0;
	}

	.switch-wrapper {
		flex-shrink: 0;
	}

	:global(.switch-element) {
		transition: all 0.3s ease;
	}

	/* Override mode styling - make more visible */
	:global(.override-toggle) {
		opacity: 1 !important;
	}

	:global(.override-toggle[data-state='checked']) {
		background-color: var(--toggle-color, var(--primary)) !important;
		border-color: var(--toggle-color, var(--primary)) !important;
		box-shadow: 0 0 8px rgba(var(--toggle-color, var(--primary)), 0.3) !important;
	}

	:global(.override-toggle[data-state='unchecked']) {
		background-color: rgba(255, 255, 255, 0.2) !important;
		border: 1px solid var(--toggle-color, var(--primary)) !important;
	}

	:global(.override-toggle .switch-thumb) {
		background-color: white !important;
		border: 1px solid var(--toggle-color, var(--primary)) !important;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
		scale: 1.1;
	}

	/* Ghost mode styling */
	:global(.ghost-toggle) {
		opacity: 0.5;
		transition: opacity 0.2s ease;
	}

	:global(.ghost-toggle:hover) {
		opacity: 0.7;
	}

	:global(.ghost-toggle.switch-button) {
		background-color: transparent !important;
		border: 1px solid var(--border) !important;
	}

	:global(.ghost-toggle.switch-checked) {
		background-color: transparent !important;
		border: 1px solid var(--border) !important;
	}

	:global(.ghost-toggle .switch-thumb) {
		background-color: transparent !important;
		border: 1px solid var(--border) !important;
	}

	/* Disabled styling */
	.toggle-control.disabled {
		opacity: 0.5;
		pointer-events: none;
	}

	:global(.disabled-toggle) {
		opacity: 0.5;
		pointer-events: none;
	}
</style>
