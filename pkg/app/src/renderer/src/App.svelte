<script lang="ts">
	import ErrorMessage from '$shared/components/settings/ErrorMessage.svelte'
	import SettingsPanel from '$shared/components/settings/SettingsPanel.svelte'
	import SettingsServerUpdate from '$shared/components/settings/SettingsServerUpdate.svelte'
	import { initializeImageChangeHandling } from '$shared/services'
	import { debugVisible, imagesError, loadImages, setDebugMenuVisible } from '$shared/stores'
	import { effectiveApiUrl } from '$shared/stores/apiStore'
	import { DebugMenu } from '@hgrandry/dbg'
	import { onMount } from 'svelte'
	import { ActionButtons, AppHeader, AppVersion, ServerInfo, Versions } from './components'

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

		// Setup image change handling (deduplication, socket events, validation)
		initializeImageChangeHandling('Desktop app')
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
