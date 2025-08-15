<script lang="ts">
	import { BackgroundImage, ErrorMessage, SettingsButton, SettingsPanel, SettingsServerUpdate, TimeDisplay, WeatherDisplay } from '$shared/components'
	import { initializeImageChangeHandling, localStorageService, socketService } from '$shared/services'
	import { expandSettings, imagesStore, screenSettings } from '$shared/stores'
	import { debugMenu } from '$shared/stores/debugStore'
	import { currentScreenType } from '$shared/stores/settingsStore'
	import { DebugMenu } from '@hgrandry/dbg'
	import { onDestroy, onMount } from 'svelte'

	let showSettings: boolean = false
	let settingsClosingTimeout: ReturnType<typeof setTimeout> | null = null
	let buttonHovered: boolean = false
	let settingsPanel: HTMLElement | null = null
	let settingsButton: HTMLElement | null = null

	// Check for open-settings URL parameter
	let openSettingsFromUrl: boolean = false

	// Cleanup function for image change handling
	let cleanupImageChanges: (() => void) | null = null

	// Function to handle API reconnection
	async function handleReconnect(): Promise<void> {
		try {
			console.log('Reconnecting to API...')
			await imagesStore.loadImages()
			console.log('Reconnection successful')
		} catch (error: unknown) {
			console.error('Reconnection failed:', error)
		}
	}

	// Initialize the app
	onMount(() => {
		;(async () => {
			try {
				// Check for open-settings URL parameter
				const urlParams = new URLSearchParams(window.location.search)
				openSettingsFromUrl = urlParams.get('openSettings') === 'true'

				// First load images using the store
				await imagesStore.loadImages()

				// Initialize localStorage service (handles loading settings automatically)
				localStorageService.init()

				// Load settings with current images
				localStorageService.loadSettings(imagesStore.getCurrentImages())

				// Add event listeners
				window.addEventListener('reconnectApi', handleReconnect)
				window.addEventListener('keydown', handleKeyDown)
				document.addEventListener('mousedown', handleClickOutside)

				// Setup socket listener for debug state changes
				socketService.onDebugStateChanged(visible => {
					console.log('Client app: Received debug state change:', visible)
					debugMenu.setVisible(visible)
				})

				// Setup image change handling (deduplication, socket events, validation)
				cleanupImageChanges = initializeImageChangeHandling('Client app')

				// Return cleanup function
				return () => {
					window.removeEventListener('reconnectApi', handleReconnect)
					window.removeEventListener('keydown', handleKeyDown)
					document.removeEventListener('mousedown', handleClickOutside)
				}
			} catch (error: unknown) {
				console.error('Error during initialization:', error)
			}
		})()
	})

	// Function to handle key down events
	function handleKeyDown(event: KeyboardEvent): void {
		if (event.key === 'Escape') {
			toggleSettings()
			event.preventDefault()
		}
	}

	// Function to handle click outside events
	function handleClickOutside(event: MouseEvent): void {
		if ($expandSettings && settingsPanel && settingsButton) {
			const target = event.target as Node
			const isClickInside = settingsPanel.contains(target) || settingsButton.contains(target)

			if (!isClickInside) {
				expandSettings.set(false)
			}
		}
	}

	// Function to handle settings toggle
	function toggleSettings(): void {
		expandSettings.update(current => !current)
	}

	// Handle expandSettings changes with explicit subscription to avoid reactive loops
	let unsubscribeExpandSettings: (() => void) | undefined

	onMount(() => {
		// Subscribe to expandSettings changes
		unsubscribeExpandSettings = expandSettings.subscribe(expanded => {
			if (expanded === false) {
				settingsClosingTimeout = setTimeout(() => {
					showSettings = false
				}, 500) // Match the duration of the CSS transition
			} else {
				showSettings = true
				if (settingsClosingTimeout) {
					clearTimeout(settingsClosingTimeout)
					settingsClosingTimeout = null
				}
			}
		})
	})

	onDestroy(() => {
		unsubscribeExpandSettings?.()
		cleanupImageChanges?.()
	})

	function handleButtonMouseEnter(): void {
		buttonHovered = true
	}

	function handleButtonMouseLeave(): void {
		buttonHovered = false
	}

	const { imagesError } = imagesStore
	const { visibility: debugVisible } = debugMenu
</script>

<div class="full-page-container">
	<DebugMenu visible={$debugVisible} open={true} />

	<SettingsServerUpdate />

	<BackgroundImage />

	{#if $screenSettings.showTimeDate}
		<TimeDisplay />
	{/if}

	{#if $screenSettings.showWeather}
		<WeatherDisplay />
	{/if}

	<SettingsButton
		hideButton={$screenSettings.hideButton || $currentScreenType === 'static'}
		{buttonHovered}
		onToggle={toggleSettings}
		onMouseEnter={handleButtonMouseEnter}
		onMouseLeave={handleButtonMouseLeave}
		bind:buttonRef={settingsButton}
	/>

	<ErrorMessage message={$imagesError || ''} />

	<div id="settings-drawer" class:open={(showSettings && $expandSettings) || openSettingsFromUrl}>
		{#if showSettings || openSettingsFromUrl}
			<SettingsPanel bind:settingsPanel expanded={$expandSettings || openSettingsFromUrl} />
		{/if}
	</div>
</div>

<style>
	#settings-drawer {
		position: fixed;
		top: 50%;
		right: 0;
		width: auto;
		transform: translate(100%, -50%);
		transition: transform 0.3s cubic-bezier(0.35, 1.04, 0.58, 1);
		background-color: rgba(0, 0, 0, 0.6);
		border-radius: 1rem;
		padding: 1rem 0.5rem 2rem 0.5rem;
	}

	#settings-drawer.open {
		transition: transform 0.5s cubic-bezier(0.35, 1.04, 0.58, 1);
		transform: translate(-1rem, -50%);
	}

	/* Override SettingsPanel positioning since drawer handles it */
	#settings-drawer :global(.settings-panel) {
		position: static !important;
		top: auto !important;
		right: auto !important;
		transform: none !important;
		/* Keep the sizing and styling */
		min-width: 450px;
		max-width: 600px;
		width: auto;
	}

	.full-page-container {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		margin: 0;
		padding: 0;
	}

	/* This ensures the app takes the full viewport */
	:global(body),
	:global(html) {
		margin: 0;
		padding: 0;
		overflow: hidden;
		height: 100%;
		width: 100%;
	}

	:root {
		height: 100%;
		width: 100%;
	}
</style>
