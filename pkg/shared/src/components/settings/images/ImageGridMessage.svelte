<script lang="ts">
	export let icon: string
	export let message: string
	export let detail: string | undefined = undefined
	export let isError: boolean = false
</script>

<div class="state-container {isError ? 'error' : ''}">
	<div class="state-content">
		<div class="state-icon">{icon}</div>
		<div class="state-message">{message}</div>
		{#if detail}
			<div class="state-detail">{detail}</div>
		{/if}
	</div>
</div>

<style>
	.state-container {
		color: var(--text-muted);
		display: flex;
		height: 120px;
		align-items: center;
		justify-content: center;
		text-align: center;
	}

	.state-container.error {
		color: var(--danger);
	}

	.state-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.state-icon {
		margin-bottom: 0.5rem;
		font-size: 2.25rem;
		opacity: 0.5;
	}

	.state-message {
		font-size: 0.875rem;
	}

	.state-detail {
		font-size: 0.75rem;
		opacity: 0.7;
	}
</style>
