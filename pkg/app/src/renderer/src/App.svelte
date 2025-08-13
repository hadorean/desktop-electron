<script lang="ts">
	import { ErrorMessage, KeyboardShortcuts, SettingsPanel, SettingsServerUpdate } from '$shared'
	import { initializeImageChangeHandling } from '$shared/services'
	import { debugVisible, effectiveApiUrl, imagesError, loadImages, setDebugMenuVisible } from '$shared/stores'
	import { toggleDayNightMode } from '$shared/stores/settingsStore'
	import { DebugMenu } from '@hgrandry/dbg'
	import { onMount } from 'svelte'
	import { ActionButtons, AppVersion, CustomHeader, OptionsButton, OptionsScreen, PageContainer, ServerInfo, Versions } from './components'
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

	<PageContainer transparent={transparentWindow} class="flex-1">
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
					<footer>
						<AppVersion />
						<OptionsButton onclick={() => gotoPage('options')} />
					</footer>
				{/if}
			</div>
		{/snippet}

		{#snippet optionsContent()}
			<OptionsScreen transparent={transparentWindow} onBack={() => gotoPage('main')} />
		{/snippet}
	</PageContainer>

	<DebugMenu visible={$debugVisible} align="bottom-right" margin={{ x: '1rem', y: '3rem' }} />
</div>

<style>
	.transparent {
		--opacity: 0.5;
		background-color: rgba(22, 22, 22, var(--opacity));
		border: 1px solid rgba(58, 58, 58, var(--opacity));
		border-radius: 10px;
		height: 100vh;
	}

	.settings-container {
		height: 100%;
		width: 100%;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		position: relative;
	}

	footer {
		position: absolute;
		bottom: 1rem;
		left: 1rem;
		right: 1.5rem;
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		align-items: center;
	}
</style>
