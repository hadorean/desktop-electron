<script lang="ts">
	import { cn } from '../../lib/utils'
	import { settingsStore } from '../../stores/settingsStore'
	import { Icon, Switch } from '../ui'

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

	const { currentScreenColor } = settingsStore

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
			<button
				class="revert-button"
				class:disabled
				onclick={handleRevert}
				title="Clear override"
				aria-label="Clear override"
			>
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
				class={cn(
					'switch-element',
					isGhost && 'ghost-toggle',
					isOverridden && 'override-toggle',
					disabled && 'disabled-toggle'
				)}
				{disabled}
			/>
		</div>
	</div>
</div>

<style>
	.toggle-control {
		width: 100%;
		--border: rgba(165, 165, 165, 0.7);
	}

	.toggle-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		height: 25px;
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
		display: flex;
		align-items: center;
		justify-content: center;
	}

	:global(.switch-button) {
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	:global(.switch-button:focus-visible) {
		/* outline: 1px solid color-mix(in srgb, var(--toggle-color, var(--primary)) 40%, transparent) !important; */
	}

	/* Regular switch styling with screen color */
	:global(.switch-button.switch-checked:not(.ghost-toggle):not(.override-toggle)) {
		background-color: var(--toggle-color, var(--primary)) !important;
		/* border-color: var(--toggle-color, var(--primary)) !important; */
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
	}

	/* Hover state should maintain the screen color */
	:global(.switch-button.switch-checked:not(.ghost-toggle):not(.override-toggle):hover) {
		background-color: var(--toggle-color, var(--primary)) !important;
		opacity: 0.9;
	}

	/* Override mode styling - make more visible */
	:global(.override-toggle) {
		opacity: 1 !important;
		--border: var(--toggle-color, var(--primary));
	}

	:global(.override-toggle.switch-checked) {
		background-color: var(--toggle-color, var(--primary)) !important;
		/* border-color: var(--toggle-color, var(--primary)) !important; */
		box-shadow: 0 0 8px rgba(var(--toggle-color, var(--primary)), 0.3) !important;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
	}

	:global(.override-toggle:not(.switch-checked)) {
		background-color: color-mix(in srgb, var(--toggle-color, var(--primary)) 40%, transparent) !important;
		/* border: 1px solid var(--toggle-color, var(--primary)) !important; */
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
	}

	:global(.override-toggle .switch-thumb) {
		background-color: white !important;
		/* border: 1px solid var(--toggle-color, var(--primary)) !important; */
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
	}

	/* Override hover state should maintain screen color */
	:global(.override-toggle.switch-checked:hover) {
		background-color: var(--toggle-color, var(--primary)) !important;
		opacity: 0.9;
	}

	/* Ghost mode styling */
	:global(.ghost-toggle) {
		opacity: 0.7;
		transition: opacity 0.2s ease;
		background-color: transparent !important;
		border: 1px solid var(--border) !important;
	}

	:global(.ghost-toggle:hover) {
		opacity: 0.7;
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
