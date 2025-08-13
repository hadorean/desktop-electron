<script lang="ts">
	import { ErrorMessage, SettingsPanel, SettingsServerUpdate } from '$shared'
	import { initializeImageChangeHandling } from '$shared/services'
	import { debugVisible, effectiveApiUrl, imagesError, loadImages, setDebugMenuVisible } from '$shared/stores'
	import { toggleDayNightMode } from '$shared/stores/settingsStore'
	import { DebugMenu } from '@hgrandry/dbg'
	import { onMount } from 'svelte'
	import { ActionButtons, CustomHeader, OptionsButton, OptionsScreen, PageContainer, ServerInfo, Versions } from './components'

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

			// Setup IPC listener for day/night mode toggle
			if (window.electron?.ipcRenderer) {
				window.electron.ipcRenderer.on('toggle-day-night-mode', async () => {
					try {
						toggleDayNightMode()
					} catch (error) {
						console.error('Failed to toggle day/night mode in renderer:', error)
					}
				})
			}
		}

		// Setup image change handling (deduplication, socket events, validation)
		initializeImageChangeHandling('Desktop app')
	})
</script>

<div class:transparent={transparentWindow} class="flex h-full flex-col">
	{#if transparentWindow}
		<CustomHeader />
	{/if}

	<PageContainer transparent={transparentWindow} class="flex-1">
		{#snippet settingsContent({ currentPage, gotoPage })}
			<div class="settings-container">
				<SettingsPanel expanded={true} transparent={transparentWindow} />

				{#if !disabled}
					<ServerInfo />
					<Versions />
				{/if}

				<!-- Options Button - only show on settings page -->
				{#if currentPage === 0}
					<OptionsButton onclick={() => gotoPage('options')} />
				{/if}

				<!-- Keyboard shortcuts - always active but conditional logic inside -->
			</div>
		{/snippet}

		{#snippet optionsContent({ gotoPage })}
			<OptionsScreen transparent={transparentWindow} onBack={() => gotoPage('main')} />
		{/snippet}
	</PageContainer>

	<DebugMenu visible={$debugVisible} align="bottom-right" margin={{ x: '1rem', y: '3rem' }} />

	<SettingsServerUpdate />
	<ActionButtons />
	<ErrorMessage message={$imagesError || ''} />
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

	.settings-container {
		height: 100%;
		width: 100%;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		position: relative;
	}
</style>
