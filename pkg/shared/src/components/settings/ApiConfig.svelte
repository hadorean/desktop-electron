<script lang="ts">
	import { apiBaseUrl, apiConfigEnabled } from '../../stores/apiStore';

	export let onApiUrlChange: (value: string) => void;
	export let onReconnect: () => void;

	let localApiUrl = $apiBaseUrl;
	let showApiConfig = $apiConfigEnabled;
	let isReconnecting = false;

	function handleApiUrlChange() {
		onApiUrlChange(localApiUrl);
		apiBaseUrl.set(localApiUrl);
	}

	function handleApiConfigToggle() {
		apiConfigEnabled.set(showApiConfig);
		// Trigger reconnection in both cases
		handleReconnect();
	}

	async function handleReconnect() {
		isReconnecting = true;
		handleApiUrlChange();
		onReconnect();

		// Reset reconnecting state after a short delay
		setTimeout(() => {
			isReconnecting = false;
		}, 2000);
	}
</script>

<div class="divider my-4"></div>

<div class="form-control">
	<label class="label cursor-pointer">
		<span class="label-text text-lg font-semibold">API Configuration</span>
		<input
			type="checkbox"
			class="toggle toggle-primary"
			bind:checked={showApiConfig}
			on:change={handleApiConfigToggle}
		/>
	</label>
</div>

{#if showApiConfig}
	<div class="form-control w-full">
		<label class="label" for="api-url">
			<span class="label-text">API Server URL</span>
		</label>
		<div class="flex gap-2">
			<input
				id="api-url"
				type="text"
				class="input input-bordered w-full"
				bind:value={localApiUrl}
				on:input={handleApiUrlChange}
			/>
			<button class="btn btn-primary {isReconnecting ? 'loading' : ''}" on:click={handleReconnect}>
				{isReconnecting ? 'Reconnecting...' : 'Reconnect'}
			</button>
		</div>
	</div>
{/if}
