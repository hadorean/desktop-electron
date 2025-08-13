<script lang="ts">
	import { Switch } from '../ui'
	import { Button } from '../ui'
	import { cn } from '../../lib/utils'

	const {
		label,
		checked,
		onChange,
		defaultValue = null,
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

	function handleOverride(): void {
		if (disabled) return

		if (!isOverridden) {
			// When enabling override, use either the defaultValue or the current shared value
			const newValue = defaultValue ?? checked ?? false
			onChange(newValue)
		} else {
			// When disabling override, set to null to use shared value
			onChange(null)
		}
	}

	function handleToggleChange(newChecked: boolean): void {
		if (disabled) return

		onChange(newChecked)
	}

	const displayChecked = $derived(isOverridden ? (overrideValue ?? false) : (checked ?? false))
</script>

<div class="toggle-control" class:disabled>
	<div class="toggle-row">
		<label class="toggle-label" for={`toggle-${label}`}>
			<span class="label-text">{label}</span>
		</label>
		{#if isOverride}
			<Button variant={isOverridden ? 'default' : 'ghost'} size="sm" class="override-button" onclick={handleOverride} {disabled}>
				{isOverridden ? 'Clear' : 'Override'}
			</Button>
		{/if}
		<Switch
			id={`toggle-${label}`}
			checked={displayChecked}
			onCheckedChange={handleToggleChange}
			class={cn('switch-element', isGhost && 'ghost-toggle', disabled && 'disabled-toggle')}
			{disabled}
		/>
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
		justify-content: space-between;
		gap: 1rem;
	}

	.toggle-label {
		display: flex;
		flex-direction: row;
		align-items: center;
		cursor: pointer;
		flex: 1;
	}

	.label-text {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--foreground);
	}

	:global(.override-button) {
		margin-right: 0.5rem; /* mr-2 */
		height: 2rem; /* h-8 */
		padding: 0 0.75rem; /* px-3 */
		font-size: 0.75rem; /* text-xs */
	}

	:global(.switch-element) {
		flex-shrink: 0;
	}

	/* Ghost mode styling */
	:global(.ghost-toggle) {
		opacity: 0.5;
		transition: opacity 0.2s ease;
	}

	:global(.ghost-toggle:hover) {
		opacity: 0.7;
	}

	/* Ghost styling for our custom switch classes */
	:global(.ghost-toggle.switch-button) {
		background-color: transparent !important;
		border: 1px solid var(--border) !important;
	}

	:global(.ghost-toggle.switch-checked) {
		background-color: transparent !important;
		border: 1px solid var(--border) !important;
	}

	/* Ghost styling for switch thumb */
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
