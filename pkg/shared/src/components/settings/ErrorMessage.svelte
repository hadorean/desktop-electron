<script lang="ts">
	import { Icon } from '../ui'

	export let message: string = ''

	let visible = false
	let timeoutId: ReturnType<typeof setTimeout> | null = null

	// Watch for message changes and handle visibility
	$: handleMessageChange(message)
	function handleMessageChange(newMessage: string) {
		if (newMessage) {
			visible = true
			// Auto-hide after 5 seconds
			if (timeoutId) clearTimeout(timeoutId)
			timeoutId = setTimeout(() => {
				visible = false
			}, 5000)
		} else {
			visible = false
			if (timeoutId) clearTimeout(timeoutId)
		}
	}

	function handleDismiss() {
		visible = false
		if (timeoutId) clearTimeout(timeoutId)
	}
</script>

{#if message && visible}
	<div class="error-message" role="alert" aria-live="assertive">
		<div class="error-content">
			<Icon name="warning-circle" size="md" className="error-icon" />
			<div class="error-text">{message}</div>
			<button class="error-dismiss" on:click={handleDismiss} aria-label="Dismiss error">
				<Icon name="x-mark" size="md" />
			</button>
		</div>
	</div>
{/if}

<style>
	.error-message {
		position: fixed;
		top: 1rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 1000;
		max-width: 90%;
		width: auto;
		min-width: 300px;
		animation: slideDown 0.3s ease-out;
	}

	.error-content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		background-color: var(--danger);
		color: var(--danger-text);
		border-radius: var(--radius);
		box-shadow: var(--shadow-lg);
		border: 1px solid rgba(239, 68, 68, 0.3);
	}

	:global(.error-icon) {
		flex-shrink: 0;
	}

	.error-text {
		flex: 1;
		font-size: 0.875rem;
		font-weight: 500;
		line-height: 1.4;
	}

	.error-dismiss {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		padding: 0;
		margin: 0;
		background: none;
		border: none;
		color: inherit;
		cursor: pointer;
		border-radius: 0.25rem;
		transition:
			background-color 0.2s ease,
			opacity 0.2s ease;
		opacity: 0.7;
	}

	.error-dismiss:hover {
		opacity: 1;
		background-color: rgba(255, 255, 255, 0.1);
	}

	.error-dismiss:focus {
		outline: none;
		opacity: 1;
		background-color: rgba(255, 255, 255, 0.1);
		box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
	}

	@keyframes slideDown {
		0% {
			opacity: 0;
			transform: translateX(-50%) translateY(-100%);
		}
		100% {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}

	/* Dark theme adjustments */
	:global(.dark) .error-content {
		border-color: rgba(239, 68, 68, 0.2);
		box-shadow:
			var(--shadow-lg),
			0 0 0 1px rgba(239, 68, 68, 0.1);
	}

	/* Responsive design */
	@media (max-width: 640px) {
		.error-message {
			max-width: 95%;
			min-width: 280px;
		}

		.error-content {
			padding: 0.875rem 1rem;
		}

		.error-text {
			font-size: 0.8125rem;
		}
	}
</style>
