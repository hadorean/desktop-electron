<script lang="ts">
	import {
		BackgroundImage,
		ErrorMessage,
		SettingsButton,
		SettingsPanel,
		SettingsServerUpdate,
		TimeDisplay,
		WeatherDisplay
	} from '$shared/components'
	import KeyboardShortcut from '$shared/components/utils/KeyboardShortcut.svelte'
	import { api, imagesService, localStorageService, socketService } from '$shared/services'
	import { debugMenu } from '$shared/stores/debugStore'
	import { imagesStore } from '$shared/stores/imagesStore'
	import { settingsStore } from '$shared/stores/settingsStore'
	import { DebugMenu } from '@hgrandry/dbg'
	import { onDestroy, onMount } from 'svelte'

	const { expandSettings, screenProfile, currentScreenType } = settingsStore

	let showSettings: boolean = false
	let settingsClosingTimeout: ReturnType<typeof setTimeout> | null = null
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
			const images = await api.getImages()
			await imagesStore.loadImages(images)
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
				const images = await api.getImages()
				await imagesStore.loadImages(images)

				// Initialize localStorage service and load complete settings in one call
				localStorageService.init(images)

				// Add event listeners
				window.addEventListener('reconnectApi', handleReconnect)
				document.addEventListener('mousedown', handleClickOutside)

				// Setup socket listener for debug state changes
				socketService.onDebugStateChanged(visible => {
					console.log('Client app: Received debug state change:', visible)
					debugMenu.setVisible(visible)
				})

				// Setup image change handling (deduplication, socket events, validation)
				cleanupImageChanges = imagesService.initializeImageChangeHandling('Client app')

				// Return cleanup function
				return () => {
					window.removeEventListener('reconnectApi', handleReconnect)
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
				settingsStore.setExpandSettings(false)
			}
		}
	}

	// Function to handle settings toggle
	function toggleSettings(): void {
		settingsStore.toggleExpandSettings()
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

	const { error: imagesError } = imagesStore
	const { visibility: debugVisible } = debugMenu
</script>

<KeyboardShortcut key="Escape" action={toggleSettings} preventDefault={false} />

<div class="full-page-container">
	<DebugMenu visible={$debugVisible} open={true} />

	<SettingsServerUpdate />

	<BackgroundImage />

	{#if $screenProfile.showTimeDate}
		<TimeDisplay />
	{/if}

	{#if $screenProfile.showWeather}
		<WeatherDisplay />
	{/if}

	<SettingsButton
		hideButton={$screenProfile.hideButton || $currentScreenType === 'static'}
		onToggle={toggleSettings}
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
		height: min(calc(100% - 5rem), 1050px);
		top: calc(50% - 2.5rem);
		right: 0;
		width: auto;
		margin: 1rem 0 3rem 0;
		transform: translate(100%, -50%);
		transition: transform 0.3s cubic-bezier(0.35, 1.04, 0.58, 1);
		background-color: rgba(0, 0, 0, 0.6);
		border-radius: 1rem;
		padding: 1rem 0.5rem 2rem 0.5rem;
		backdrop-filter: blur(10px);
		display: flex;
		flex-direction: column;
		padding: 1rem;
	}

	#settings-drawer.open {
		transition: transform 0.5s cubic-bezier(0.35, 1.04, 0.58, 1);
		transform: translate(-1rem, -50%);
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
