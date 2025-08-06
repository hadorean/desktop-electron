<script lang="ts">
	import { allSettings, currentScreen } from '../../stores/settingsStore';
	import { apiBaseUrl } from '../../stores/apiStore';
	import { routeParams } from '../../stores/routeStore';
	import { onMount, onDestroy } from 'svelte';
	import { socketService } from '../../services/socket';
	import { Inspect } from '@hgrandry/dbg';
	import type { SettingsUpdateEvent } from '@heyketsu/shared';

	let isConnected = false;
	let updatingSettingsFromServer = false;
	let initialSubscribeHandled = false;
	let unsubscribeSettings: (() => void) | null = null;

	onMount(() => {
		// Setup Socket.IO connection status monitoring
		socketService.onConnectionStatus((connected) => {
			isConnected = connected;
			console.log('Socket.IO connection status:', connected);
		});

		// Setup settings update handler
		socketService.onSettingsUpdate((event: SettingsUpdateEvent) => {
			updatingSettingsFromServer = true;
			try {
				console.log('Applying settings from server:', event.settings);
				const newSettings = event.settings;

				// Check if current screen exists in server settings
				const currentScreenId = $currentScreen;
				if (newSettings.screens && !newSettings.screens[currentScreenId]) {
					// Add current screen to settings (empty object)
					newSettings.screens[currentScreenId] = {};
					updatingSettingsFromServer = false; // we want to update the server settings with the new screen
				}

				allSettings.set(newSettings);
			} catch (error) {
				console.error('Error updating settings from server:', error);
			}
			updatingSettingsFromServer = false;
		});

		// Monitor API base URL changes and update socket connection
		apiBaseUrl.subscribe((serverUrl) => {
			if (serverUrl) {
				socketService.updateServerUrl(serverUrl);
			}
		});

		// Subscribe to settings changes and send to server
		unsubscribeSettings = allSettings.subscribe((value) => {
			if (!initialSubscribeHandled) {
				initialSubscribeHandled = true;
				return; // Skip the initial subscribe callback
			}

			if (!updatingSettingsFromServer && socketService.getConnectionStatus()) {
				console.log('Updating settings from client:', value);
				// Use route params userId as client ID if available
				const clientId = $routeParams.userId || socketService.getSocketId();
				socketService.updateSettings(value, clientId);
			}
		});
	});

	onDestroy(() => {
		// Clean up subscriptions
		if (unsubscribeSettings) {
			unsubscribeSettings();
		}
	});
</script>

<Inspect>
	{#if isConnected}
		<span class="status-indicator connected">🟢 Socket.IO Connected</span>
	{:else}
		<span class="status-indicator disconnected">🔴 Socket.IO Disconnected</span>
	{/if}
</Inspect>

<style>
	.socket-status {
		position: fixed;
		top: 10px;
		right: 10px;
		z-index: 1000;
		background: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 8px 12px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: bold;
	}

	.status-indicator.connected {
		color: #4ade80;
	}

	.status-indicator.disconnected {
		color: #f87171;
	}
</style>
