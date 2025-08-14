<script lang="ts">
	import { apiBaseUrl, apiConfigEnabled } from '../../stores/apiStore'

	export let onApiUrlChange: (value: string) => void
	export let onReconnect: () => void

	let localApiUrl = $apiBaseUrl
	let showApiConfig = $apiConfigEnabled
	let isReconnecting = false

	function handleApiUrlChange(): void {
		onApiUrlChange(localApiUrl)
		apiBaseUrl.set(localApiUrl)
	}

	function handleApiConfigToggle(): void {
		apiConfigEnabled.set(showApiConfig)
		// Trigger reconnection in both cases
		handleReconnect()
	}

	async function handleReconnect(): Promise<void> {
		isReconnecting = true
		handleApiUrlChange()
		onReconnect()

		// Reset reconnecting state after a short delay
		setTimeout(() => {
			isReconnecting = false
		}, 2000)
	}
</script>

<div class="api-config">
	<div class="divider"></div>

	<div class="config-toggle">
		<label class="toggle-label">
			<span class="toggle-text">API Configuration</span>
			<input type="checkbox" class="toggle-input" bind:checked={showApiConfig} on:change={handleApiConfigToggle} />
			<span class="toggle-switch"></span>
		</label>
	</div>

	{#if showApiConfig}
		<div class="config-form">
			<label class="input-label" for="api-url">
				<span class="label-text">API Server URL</span>
			</label>
			<div class="input-group">
				<input id="api-url" type="text" class="url-input" bind:value={localApiUrl} on:input={handleApiUrlChange} placeholder="http://localhost:8080" />
				<button class="reconnect-btn {isReconnecting ? 'loading' : ''}" on:click={handleReconnect} disabled={isReconnecting}>
					{isReconnecting ? 'Reconnecting...' : 'Reconnect'}
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.api-config {
		margin: 1rem 0;
	}

	.divider {
		height: 1px;
		background-color: var(--border);
		margin: 1rem 0;
		opacity: 0.5;
	}

	.config-toggle {
		margin-bottom: 1rem;
	}

	.toggle-label {
		display: flex;
		align-items: center;
		justify-content: space-between;
		cursor: pointer;
		padding: 0.5rem 0;
	}

	.toggle-text {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.toggle-input {
		position: absolute;
		opacity: 0;
		cursor: pointer;
	}

	.toggle-switch {
		position: relative;
		width: 3rem;
		height: 1.5rem;
		background-color: var(--surface-hover);
		border-radius: 0.75rem;
		transition: background-color 0.3s ease;
	}

	.toggle-switch::before {
		content: '';
		position: absolute;
		top: 0.125rem;
		left: 0.125rem;
		width: 1.25rem;
		height: 1.25rem;
		background-color: var(--text-primary);
		border-radius: 50%;
		transition: transform 0.3s ease;
	}

	.toggle-input:checked + .toggle-switch {
		background-color: var(--primary);
	}

	.toggle-input:checked + .toggle-switch::before {
		transform: translateX(1.5rem);
		background-color: var(--primary-text);
	}

	.config-form {
		margin-top: 1rem;
	}

	.input-label {
		display: block;
		margin-bottom: 0.5rem;
	}

	.label-text {
		color: var(--text-secondary);
		font-size: 0.875rem;
		font-weight: 500;
	}

	.input-group {
		display: flex;
		gap: 0.5rem;
		align-items: stretch;
	}

	.url-input {
		flex: 1;
		padding: 0.75rem 1rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background-color: var(--input-bg);
		color: var(--text-primary);
		font-size: 0.875rem;
		transition:
			border-color 0.3s ease,
			box-shadow 0.3s ease;
	}

	.url-input:focus {
		outline: none;
		border-color: var(--primary);
		box-shadow: 0 0 0 2px rgba(139, 161, 167, 0.1);
	}

	.url-input::placeholder {
		color: var(--text-muted);
	}

	.reconnect-btn {
		padding: 0.75rem 1.5rem;
		background-color: var(--primary);
		color: var(--primary-text);
		border: none;
		border-radius: var(--radius);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			background-color 0.3s ease,
			opacity 0.3s ease;
		white-space: nowrap;
	}

	.reconnect-btn:hover:not(:disabled) {
		background-color: var(--primary-hover);
	}

	.reconnect-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.reconnect-btn.loading {
		position: relative;
		color: transparent;
	}

	.reconnect-btn.loading::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 1rem;
		height: 1rem;
		border: 2px solid var(--primary-text);
		border-top: 2px solid transparent;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: translate(-50%, -50%) rotate(0deg);
		}
		100% {
			transform: translate(-50%, -50%) rotate(360deg);
		}
	}
</style>
