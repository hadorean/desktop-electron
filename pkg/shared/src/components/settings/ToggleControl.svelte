<script lang="ts">
	import { Switch } from '../ui';
	import { Button } from '../ui';
	import { cn } from '../../lib/utils';

	const {
		label,
		checked,
		onChange,
		defaultValue = null,
		isOverride = false,
		overrideValue = null
	} = $props<{
		label: string;
		checked: boolean | null;
		onChange: (value: boolean | null) => void;
		defaultValue?: boolean | null;
		isOverride?: boolean;
		overrideValue?: boolean | null;
	}>();

	const isOverridden = $derived(isOverride && overrideValue !== null);
	const isGhost = $derived(isOverride && !isOverridden);

	function handleOverride(): void {
		if (!isOverridden) {
			// When enabling override, use either the defaultValue or the current shared value
			const newValue = defaultValue ?? checked ?? false;
			onChange(newValue);
		} else {
			// When disabling override, set to null to use shared value
			onChange(null);
		}
	}

	function handleToggleChange(newChecked: boolean): void {
		onChange(newChecked);
	}

	const displayChecked = $derived(isOverridden ? (overrideValue ?? false) : (checked ?? false));
</script>

<div class="toggle-control">
	<div class="toggle-row">
		<label class="toggle-label" for={`toggle-${label}`}>
			<span class="label-text">{label}</span>
		</label>
		{#if isOverride}
			<Button variant={isOverridden ? 'default' : 'ghost'} size="sm" class="text-xs h-8 px-3 mr-2" onclick={handleOverride}>
				{isOverridden ? 'Clear' : 'Override'}
			</Button>
		{/if}
		<Switch id={`toggle-${label}`} checked={displayChecked} onCheckedChange={handleToggleChange} class={cn('flex-shrink-0', isGhost && 'ghost-toggle')} />
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
		color: hsl(var(--foreground));
	}

	/* Ghost mode styling */
	:global(.ghost-toggle) {
		opacity: 0.5;
		transition: opacity 0.2s ease;
	}

	:global(.ghost-toggle:hover) {
		opacity: 0.7;
	}

	/* Ghost styling for switch background */
	:global(.ghost-toggle.bg-primary) {
		background-color: transparent !important;
		border: 1px solid hsl(var(--border)) !important;
	}

	:global(.ghost-toggle.bg-input) {
		background-color: transparent !important;
		border: 1px solid hsl(var(--border)) !important;
	}

	/* Ghost styling for switch thumb */
	:global(.ghost-toggle .bg-background) {
		background-color: transparent !important;
		border: 1px solid hsl(var(--border)) !important;
	}
</style>
