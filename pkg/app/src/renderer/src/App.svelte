<script lang="ts">
	import SettingsPanel from '$shared/components/settings/SettingsPanel.svelte'
	import { effectiveApiUrl } from '$shared/stores/apiStore'
	import { debugVisible, setDebugMenuVisible, loadImages, imagesError, onImagesChanged, getIsLoadingImages } from '$shared/stores'
	import { validateSelectedImages } from '$shared/stores'
	import { socketService } from '$shared/services/socket'
	import ErrorMessage from '$shared/components/settings/ErrorMessage.svelte'
	import { Versions, AppVersion, AppHeader, ActionButtons, ServerInfo } from './components'
	import { DebugMenu } from '@hgrandry/dbg'
	import { onMount } from 'svelte'
	import SettingsServerUpdate from '$shared/components/settings/SettingsServerUpdate.svelte'
	const disabled = true
	
	// Track processed events to prevent duplicates
	let lastProcessedEventTimestamp = 0

	onMount(async () => {
		effectiveApiUrl.set('http://localhost:8080')

		// Load images using the store
		await loadImages()

		// Setup IPC listener for debug state changes
		if (window.api) {
			window.api.onDebugStateChanged((visible) => {
				console.log('Desktop app: Received debug state change:', visible)
				setDebugMenuVisible(visible)
			})
		}

		// Setup socket listener for images updated events
		socketService.onImagesUpdated(async (event) => {
			console.log('Desktop app: Received images updated event:', event)
			
			// Deduplicate events with the same timestamp
			if (event.timestamp <= lastProcessedEventTimestamp) {
				console.log('🚫 Skipping duplicate event (already processed)')
				return
			}
			
			lastProcessedEventTimestamp = event.timestamp
			
			// Only refresh if it's a file change event
			if (event.reason === 'file_change') {
				console.log('🔄 Processing unique file change event')
				await loadImages()
			}
		})

		// Setup image change validation (skip during initial loading to prevent cascades)
		onImagesChanged((newImages) => {
			// Only validate if we're not currently loading to prevent validation cascades
			if (!getIsLoadingImages()) {
				const imageNames = newImages.map((img) => img.name)
				validateSelectedImages(imageNames)
			}
		})
	})
</script>

<SettingsPanel expanded={true} />
<SettingsServerUpdate />
<AppVersion />
<ActionButtons />
<ErrorMessage message={$imagesError || ''} />

{#if !disabled}
	<AppHeader />
	<ServerInfo />
	<Versions />
{/if}
<DebugMenu visible={$debugVisible} align="bottom-right" margin={{ x: '1rem', y: '3rem' }} />

<style>
</style>
