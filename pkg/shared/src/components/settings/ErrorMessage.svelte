<script lang="ts">
	export let message: string = ''
</script>

{#if message}
	<div class="alert alert-error">{message}</div>
{/if}

<style>
	.alert {
		position: fixed;
		top: 1rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 1000;
		max-width: 90%;
		width: auto;
	}
</style>
