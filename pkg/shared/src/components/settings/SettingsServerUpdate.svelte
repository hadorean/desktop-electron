<script lang="ts">
	import { Inspect } from '@hgrandry/dbg'
	import { onDestroy, onMount } from 'svelte'
	import { socketService } from '../../services/socket'
	import { apiStore } from '../../stores/apiStore'
	import { settingsStore } from '../../stores/settingsStore'
	import type { SettingsUpdateEvent } from '../../types'

	let isConnected = false
	let updatingSettingsFromServer = false
	let initialSubscribeHandled = false
	let unsubscribeSettings: (() => void) | null = null

	const { userSettings, currentScreenId } = settingsStore

	onMount(() => {
		// Setup Socket.IO connection status monitoring
		socketService.onConnectionStatus(connected => {
			isConnected = connected
			console.log('Socket.IO connection status:', connected)
		})

		// Setup settings update handler
		socketService.onSettingsUpdate((event: SettingsUpdateEvent) => {
			updatingSettingsFromServer = true
			try {
				console.log('Applying settings from server:', event.settings)
				const newSettings = event.settings

				// Check if current screen exists in server settings
				if (newSettings.screens && !newSettings.screens[$currentScreenId]) {
					// Add current screen to settings (empty object, colors are computed)
					newSettings.screens[$currentScreenId] = { day: {}, night: {}, monitorIndex: null, monitorEnabled: true }
					updatingSettingsFromServer = false // we want to update the server settings with the new screen
				}

				settingsStore.updateSettings(newSettings)
			} catch (error) {
				console.error('Error updating settings from server:', error)
			}
			updatingSettingsFromServer = false
		})

		// Monitor API base URL changes and update socket connection
		apiStore.url.subscribe(serverUrl => {
			if (serverUrl) {
				socketService.setServerUrl(serverUrl)
			}
		})

		// Subscribe to settings changes and send to server
		unsubscribeSettings = userSettings.subscribe(value => {
			if (!initialSubscribeHandled) {
				initialSubscribeHandled = true
				return // Skip the initial subscribe callback
			}

			// Check if server sync should be prevented (e.g., during validation operations)
			if (settingsStore.shouldPreventServerSync()) {
				console.log('🚫 Skipping server sync (silent update)')
				return
			}

			if (!updatingSettingsFromServer && socketService.getConnectionStatus()) {
				console.log('Updating settings from client:', value)
				// Use socket ID as client ID
				const clientId = socketService.getSocketId()
				socketService.updateSettings(value, clientId)
			}
		})
	})

	onDestroy(() => {
		// Clean up subscriptions
		if (unsubscribeSettings) {
			unsubscribeSettings()
		}
	})
</script>

<Inspect>
	{#if isConnected}
		<span class="connected">🟢 Socket.IO Connected</span>
	{:else}
		<span class="disconnected">🔴 Socket.IO Disconnected</span>
	{/if}
</Inspect>

<style>
	.connected {
		color: #4ade80;
	}

	.disconnected {
		color: #f87171;
	}
</style>
