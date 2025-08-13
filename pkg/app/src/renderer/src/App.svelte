<script lang="ts">
	import { ErrorMessage, KeyboardShortcuts, SettingsPanel, SettingsServerUpdate } from '$shared'
	import { initializeImageChangeHandling } from '$shared/services'
	import { debugVisible, effectiveApiUrl, imagesError, loadImages, setDebugMenuVisible } from '$shared/stores'
	import { toggleDayNightMode } from '$shared/stores/settingsStore'
	import { DebugMenu } from '@hgrandry/dbg'
	import { onMount } from 'svelte'
	import { ActionButtons, CustomHeader, OptionsButton, OptionsScreen, ServerInfo, Versions } from './components'
	import SimplePageContainer from './components/SimplePageContainer.svelte'
	import { currentPage, gotoPage } from './stores/pageStore'

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

		// Add click debugging (only when body has debug class)
		document.addEventListener(
			'click',
			(event) => {
				if (document.body.classList.contains('debug')) {
					console.log('🐛 DEBUG Click event:', {
						target: event.target,
						tagName: (event.target as Element)?.tagName,
						className: (event.target as Element)?.className,
						id: (event.target as Element)?.id,
						coordinates: { x: event.clientX, y: event.clientY }
					})
				}
			},
			true
		)
	})
</script>

<KeyboardShortcuts
	shortcuts={[
		{
			key: 'Escape',
			action: () => {
				if ($currentPage === 'main') {
					gotoPage('options')
				} else {
					gotoPage('main')
				}
			}
		}
	]}
/>

<div class:transparent={transparentWindow} class="flex h-full flex-col">
	{#if transparentWindow}
		<CustomHeader />
	{/if}

	<SimplePageContainer transparent={transparentWindow} class="flex-1">
		{#snippet settingsContent()}
			<div class="settings-container">
				<SettingsPanel expanded={true} transparent={transparentWindow} />
				<SettingsServerUpdate />
				<ActionButtons />
				<ErrorMessage message={$imagesError || ''} />

				{#if !disabled}
					<ServerInfo />
					<Versions />
				{/if}

				<!-- Options Button - only show on settings page -->
				{#if $currentPage === 'main'}
					<OptionsButton onclick={() => gotoPage('options')} />
				{/if}
			</div>
		{/snippet}

		{#snippet optionsContent()}
			<OptionsScreen transparent={transparentWindow} onBack={() => gotoPage('main')} />
		{/snippet}
	</SimplePageContainer>

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

	.settings-container {
		height: 100%;
		width: 100%;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		position: relative;
	}

	/* Debug styles - only active when body has 'debug' class */
	:global(body.debug button) {
		border: 2px solid red !important;
		background: rgba(255, 0, 0, 0.1) !important;
	}

	:global(body.debug .settings-container) {
		border: 3px solid yellow !important;
	}

	:global(body.debug .page-container) {
		border: 3px solid blue !important;
	}

	:global(body.debug .carousel) {
		border: 2px solid green !important;
	}

	:global(body.debug .carousel-content) {
		border: 2px solid purple !important;
	}

	:global(body.debug .carousel-item) {
		border: 2px solid orange !important;
	}

	/* Highlight any elements with pointer-events: none */
	:global(body.debug *[style*='pointer-events: none']) {
		background: rgba(255, 255, 0, 0.3) !important;
		border: 2px dashed black !important;
	}

	/* Debug info overlay when debug mode is active */
	:global(body.debug::before) {
		content: '🐛 DEBUG MODE ACTIVE - Layout borders visible';
		position: fixed;
		top: 10px;
		right: 10px;
		background: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 5px 10px;
		border-radius: 4px;
		font-size: 12px;
		z-index: 9999;
		pointer-events: none;
	}
</style>
