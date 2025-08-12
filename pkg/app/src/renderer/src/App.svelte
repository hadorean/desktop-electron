<script lang="ts">
	import { ErrorMessage, SettingsPanel, SettingsServerUpdate } from '$shared'
	import { initializeImageChangeHandling } from '$shared/services'
	import { debugVisible, effectiveApiUrl, imagesError, loadImages, setDebugMenuVisible } from '$shared/stores'
	import { DebugMenu } from '@hgrandry/dbg'
	import { onMount } from 'svelte'
	import { ActionButtons, AppHeader, AppVersion, CustomHeader, ServerInfo, Versions } from './components'

	const disabled = true
	let transparentWindow = $state(false)

	onMount(async () => {
		effectiveApiUrl.set('http://localhost:8080')

		// Load images using the store
		await loadImages()

		// Get window configuration
		if (window.api) {
			try {
				const config = await window.api.getWindowConfig()
				transparentWindow = config.window.transparent
				console.log('Desktop app: Window config:', config)
			} catch (error) {
				console.error('Failed to get window config:', error)
			}

			// Setup IPC listener for debug state changes
			window.api.onDebugStateChanged((visible) => {
				console.log('Desktop app: Received debug state change:', visible)
				setDebugMenuVisible(visible)
			})
		}

		// Setup image change handling (deduplication, socket events, validation)
		initializeImageChangeHandling('Desktop app')
	})
</script>

<div class:transparent={transparentWindow}>
	{#if transparentWindow}
		<CustomHeader />
	{/if}
	<SettingsPanel expanded={true} transparent={transparentWindow} />
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
</div>

<style>
	.transparent {
		--opacity: 0.5;
		background-color: rgba(22, 22, 22, var(--opacity));
		border: 1px solid rgba(58, 58, 58, var(--opacity));
		border-radius: 10px;
		height: 100vh;
		-webkit-app-region: drag;
	}

	/* Make interactive elements non-draggable, but keep labels draggable */
	.transparent :global(button),
	.transparent :global(input),
	.transparent :global(select),
	.transparent :global(textarea),
	.transparent :global(.slider),
	.transparent :global(.settings-panel),
	.transparent :global(.debug-menu) {
		-webkit-app-region: no-drag;
	}

	/* Explicitly make text elements draggable */
	.transparent :global(label),
	.transparent :global(h1),
	.transparent :global(h2),
	.transparent :global(h3),
	.transparent :global(h4),
	.transparent :global(h5),
	.transparent :global(h6) {
		-webkit-app-region: drag;
	}
</style>
