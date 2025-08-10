<script lang="ts">
	import { routeParams, hasValidParams } from '../../stores/routeStore';
</script>

{#if $hasValidParams}
	<slot />
{:else}
	<div class="missing-params-message">
		<h2>Missing Required Parameters</h2>
		<p>This application requires a valid user ID and screen ID in the URL.</p>
		<p>Expected format: /app/{`{screenId}`}</p>
		<p>
			Current params: Screen ID: {$routeParams.screenId || 'missing'}
		</p>
	</div>
{/if}

<style>
	.missing-params-message {
		padding: 20px;
		text-align: center;
		color: red;
	}
</style>
