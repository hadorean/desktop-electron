<script lang="ts">
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

	function handleModeChange(event: Event) {
		const target = event.target as HTMLSelectElement
		const value = target.value
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

	<select class="mode-selector" value={mode} onchange={handleModeChange}>
		<option value="image">Image</option>
		<option value="url">URL</option>
	</select>
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

	.mode-selector {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-md);
		background: rgba(0, 0, 0, 0.2);
		border: 1px solid hsl(var(--border) / 0.3);
		color: var(--text-primary);
		font-size: 0.875rem;
		transition: all 0.2s ease;
	}

	.mode-selector:hover {
		background: rgba(0, 0, 0, 0.3);
	}

	.mode-selector:focus {
		outline: none;
		border-color: var(--primary);
		box-shadow: 0 0 0 2px hsl(var(--primary) / 0.2);
	}
</style>
