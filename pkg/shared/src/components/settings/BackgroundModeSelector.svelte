<script lang="ts">
	import { Select, SelectContent, SelectItem, SelectTrigger } from '../ui/select'

	const {
		mode = 'image',
		onModeChange,
		canRevert = false,
		onRevert
	} = $props<{
		mode: 'image' | 'url'
		onModeChange: (mode: 'image' | 'url') => void
		canRevert?: boolean
		onRevert?: () => void
	}>()

	function handleModeChange(value: string | undefined) {
		if (value === 'image' || value === 'url') {
			onModeChange(value)
		}
	}
</script>

<div class="mode-selector-container">
	<div class="header-section">
		<h3 class="section-title">Background</h3>
		{#if canRevert && onRevert}
			<button class="revert-button" onclick={onRevert} title="Clear override" aria-label="Clear override">
				<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
					<path d="M3 3v5h5" />
				</svg>
			</button>
		{/if}
	</div>

	<Select type="single" value={mode} onValueChange={handleModeChange}>
		<SelectTrigger>
			{mode === 'image' ? 'Image' : 'URL'}
		</SelectTrigger>
		<SelectContent>
			<SelectItem value="image" label="Image">Image</SelectItem>
			<SelectItem value="url" label="URL">URL</SelectItem>
		</SelectContent>
	</Select>
</div>

<style>
	.mode-selector-container {
		width: 100%;
		margin-bottom: 1rem;
	}

	.header-section {
		margin-bottom: 0.5rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.section-title {
		font-size: 1.1rem;
		font-weight: 500;
		color: var(--text-primary);
		margin: 0;
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

	.revert-button:hover {
		background: var(--surface-hover);
		color: var(--text-primary);
		transform: scale(1.1);
	}

	/* Ensure Select component takes full width */
	:global(.mode-selector-container [data-bits-select-root]),
	:global(.mode-selector-container [data-select-root]),
	:global(.mode-selector-container > *) {
		width: 100% !important;
	}
</style>
