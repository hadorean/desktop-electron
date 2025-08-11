<script lang="ts">
	import SettingsPanel from '$shared/components/settings/SettingsPanel.svelte'
	import { effectiveApiUrl } from '$shared/stores/apiStore'
	import { debugVisible, setDebugMenuVisible, loadImages, imagesError, onImagesChanged } from '$shared/stores'
	import { validateSelectedImages } from '$shared/stores'
	import { socketService } from '$shared/services/socket'
	import ErrorMessage from '$shared/components/settings/ErrorMessage.svelte'
	import { Versions, AppVersion, AppHeader, ActionButtons, ServerInfo } from './components'
	import { DebugMenu } from '@hgrandry/dbg'
	import { onMount } from 'svelte'
	import SettingsServerUpdate from '$shared/components/settings/SettingsServerUpdate.svelte'
	const disabled = true

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
			// Refresh the images store
			await loadImages()
		})

		// Setup image change validation
		onImagesChanged((newImages) => {
			const imageNames = newImages.map((img) => img.name)
			validateSelectedImages(imageNames)
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
