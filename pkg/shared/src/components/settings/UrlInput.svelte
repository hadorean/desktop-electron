<script lang="ts">
	import { Card, CardContent } from '../ui'

	const {
		url = '',
		onUrlChange,
		isOverride = false,
		overrideValue = null,
		placeholder = 'Enter URL (e.g., https://example.com)'
	} = $props<{
		url: string
		onUrlChange: (url: string | null) => void
		isOverride?: boolean
		overrideValue?: string | null
		placeholder?: string
	}>()

	const isOverridden = $derived(isOverride && overrideValue !== null)
	const isGhost = $derived(isOverride && !isOverridden)
	const effectiveUrl = $derived(isOverridden ? overrideValue : url)

	function handleUrlInput(event: Event) {
		const target = event.target as HTMLInputElement
		const newUrl = target.value.trim()

		if (isOverride && !isOverridden && newUrl) {
			// When enabling override in local mode
			onUrlChange(newUrl)
		} else {
			onUrlChange(newUrl || null)
		}
	}

	function isValidUrl(urlString: string): boolean {
		if (!urlString) return false
		try {
			const url = new URL(urlString)
			return url.protocol === 'http:' || url.protocol === 'https:'
		} catch {
			return false
		}
	}

	const urlValidation = $derived.by(() => {
		if (!effectiveUrl) return { isValid: true, message: '' }
		const isValid = isValidUrl(effectiveUrl)
		return {
			isValid,
			message: isValid ? '' : 'Please enter a valid HTTP or HTTPS URL'
		}
	})
</script>

<Card class="url-input-card {isGhost ? 'ghost-url-input' : ''}">
	<CardContent class="url-card-content">
		<div class="url-input-container">
			<input
				type="url"
				value={effectiveUrl || ''}
				oninput={handleUrlInput}
				{placeholder}
				class="url-input {isGhost ? 'ghost-input' : ''} {!urlValidation.isValid ? 'error' : ''}"
			/>
			{#if !urlValidation.isValid && effectiveUrl}
				<div class="error-message">
					{urlValidation.message}
				</div>
			{/if}
		</div>

		{#if effectiveUrl && urlValidation.isValid}
			<div class="url-preview">
				<div class="preview-label">Preview:</div>
				<div class="preview-url">{effectiveUrl}</div>
			</div>
		{/if}
	</CardContent>
</Card>

<style>
	:global(.url-input-card) {
		background: rgba(0, 0, 0, 0.2) !important;
		border: 1px solid hsl(var(--border) / 0.3) !important;
		margin-top: 0.5rem;
	}

	:global(.url-card-content) {
		padding: 1rem !important;
	}

	.url-input-container {
		width: 100%;
	}

	.url-input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-md);
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid hsl(var(--border) / 0.5);
		color: var(--text-primary);
		font-size: 0.875rem;
		transition: all 0.2s ease;
	}

	.url-input:focus {
		outline: none;
		border-color: var(--primary);
		box-shadow: 0 0 0 2px hsl(var(--primary) / 0.2);
	}

	.url-input.error {
		border-color: var(--danger);
	}

	.error-message {
		color: var(--danger);
		font-size: 0.75rem;
		margin-top: 0.5rem;
	}

	.url-preview {
		margin-top: 1rem;
		padding: 0.75rem;
		background: rgba(0, 0, 0, 0.2);
		border-radius: var(--radius-md);
		border: 1px solid hsl(var(--border) / 0.3);
	}

	.preview-label {
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin-bottom: 0.25rem;
	}

	.preview-url {
		font-size: 0.875rem;
		color: var(--text-primary);
		word-break: break-all;
		font-family: monospace;
	}

	/* Ghost mode styling */
	:global(.ghost-url-input) {
		opacity: 0.5 !important;
		transition: opacity 0.2s ease;
	}

	:global(.ghost-url-input:hover) {
		opacity: 0.7 !important;
	}

	.ghost-input {
		opacity: 0.6;
		background: transparent;
		border: 1px solid hsl(var(--border) / 0.5);
	}

	.ghost-input:hover {
		opacity: 0.8;
	}
</style>
