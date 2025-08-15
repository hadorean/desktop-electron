<script lang="ts">
	import { Inspect } from '@hgrandry/dbg'
	import { onMount } from 'svelte'
	import { currentScreen, editingSettings, inTransition, isLocalMode, screenSettings, updateEditingSettings } from '../../stores'
	import { currentScreenType } from '../../stores/settingsStore'
	import ImageGrid from './ImageGrid.svelte'
	import ScreenSwitcher from './ScreenSwitcher.svelte'
	import SliderControl from './SliderControl.svelte'
	import ToggleControl from './ToggleControl.svelte'

	// Props
	export let expanded: boolean = false
	//export let errorMessage: string = "";
	export let settingsPanel: HTMLElement | null = null
	export let transparent: boolean = false

	// Reference to ScreenSwitcher component
	let screenSwitcher: ScreenSwitcher

	// Document-level keyboard handler for Tab key
	function handleDocumentKeyDown(event: KeyboardEvent): void {
		// Only handle Tab when settings panel is expanded and visible
		if (event.key === 'Tab' && expanded && settingsPanel) {
			event.preventDefault()

			// Switch screens based on direction
			const direction = event.shiftKey ? 'backward' : 'forward'
			screenSwitcher?.switchToNextScreen(direction)
		}
	}

	onMount(() => {
		// Add document-level event listener when component mounts
		document.addEventListener('keydown', handleDocumentKeyDown)

		// Clean up event listener when component unmounts
		return () => {
			document.removeEventListener('keydown', handleDocumentKeyDown)
		}
	})

	function handleSettingChange<K extends keyof typeof $editingSettings>(key: K, value: (typeof $editingSettings)[K] | null): void {
		updateEditingSettings(current => {
			if (value === null) {
				// Remove property (reset to default)
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { [key]: _removed, ...rest } = current
				return rest
			} else {
				// Update property
				return {
					...current,
					[key]: value
				}
			}
		})
	}
</script>

<div class="settings-panel" bind:this={settingsPanel} class:expanded class:transparent>
	<ScreenSwitcher bind:this={screenSwitcher} />
	<div class="settings-content">
		<Inspect>
			{#if $isLocalMode}
				Settings - {$currentScreen}
			{:else}
				Settings - Shared
			{/if}
		</Inspect>

		<div class="settings-groups">
			<!-- Image Selection -->
			<div class="setting-section">
				<!-- Display Options -->
				<ImageGrid
					selectedImage={$screenSettings.selectedImage ?? ''}
					isOverride={$isLocalMode}
					overrideValue={$editingSettings.selectedImage}
					onImageChange={(newImage: string | null) => handleSettingChange('selectedImage', newImage)}
				/>

				<SliderControl
					label="Brightness"
					value={$editingSettings.opacity ?? null}
					min={0}
					max={1}
					step={0.01}
					onChange={(newOpacity: number | null) => handleSettingChange('opacity', newOpacity)}
					formatValue={(v: number) => v.toFixed(2)}
					isOverride={$isLocalMode}
					defaultValue={1}
					overrideValue={$editingSettings.opacity}
					disabled={$inTransition}
				/>

				<SliderControl
					label="Saturation"
					value={$editingSettings.saturation ?? null}
					min={0}
					max={2}
					step={0.01}
					onChange={(newSaturation: number | null) => handleSettingChange('saturation', newSaturation)}
					formatValue={(v: number) => v.toFixed(2)}
					isOverride={$isLocalMode}
					defaultValue={1}
					overrideValue={$editingSettings.saturation}
					disabled={$inTransition}
				/>

				<SliderControl
					label="Blur"
					value={$editingSettings.blur ?? null}
					min={0}
					max={50}
					step={0.1}
					onChange={(newBlur: number | null) => handleSettingChange('blur', newBlur)}
					formatValue={(v: number) => `${v.toFixed(1)}px`}
					isOverride={$isLocalMode}
					defaultValue={0}
					overrideValue={$editingSettings.blur}
					disabled={$inTransition}
				/>

				<SliderControl
					label="Transition Time"
					value={$editingSettings.transitionTime ?? null}
					min={0}
					max={10}
					step={0.1}
					onChange={(newTransitionTime: number | null) => handleSettingChange('transitionTime', newTransitionTime)}
					formatValue={(v: number) => `${v.toFixed(1)}s`}
					isOverride={$isLocalMode}
					defaultValue={1}
					overrideValue={$editingSettings.transitionTime}
					disabled={$inTransition}
				/>
			</div>

			<ToggleControl
				label="Time and date"
				checked={$editingSettings.showTimeDate ?? $screenSettings.showTimeDate ?? true}
				onChange={(newShowTimeDate: boolean | null) => handleSettingChange('showTimeDate', newShowTimeDate)}
				isOverride={$isLocalMode}
				overrideValue={$editingSettings.showTimeDate}
				defaultValue={true}
				disabled={$inTransition}
			/>

			<ToggleControl
				label="Weather"
				checked={$editingSettings.showWeather ?? $screenSettings.showWeather ?? false}
				onChange={(newShowWeather: boolean | null) => handleSettingChange('showWeather', newShowWeather)}
				isOverride={$isLocalMode}
				overrideValue={$editingSettings.showWeather}
				defaultValue={false}
				disabled={$inTransition}
			/>

			{#if $currentScreenType === 'interactive'}
				<ToggleControl
					label="Auto-hide settings button"
					checked={$editingSettings.hideButton ?? $screenSettings.hideButton ?? false}
					onChange={(newHideButton: boolean | null) => handleSettingChange('hideButton', newHideButton)}
					isOverride={$isLocalMode}
					overrideValue={$editingSettings.hideButton}
					defaultValue={false}
					disabled={$inTransition}
				/>
			{/if}
		</div>
	</div>
</div>

<style>
	.settings-panel {
		padding: 1rem 2rem;
		color: var(--text-primary);
		max-width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		z-index: 1000;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.9);
		transition: opacity 0.3s cubic-bezier(0.9, 0.14, 1, 0.75);
		opacity: 0;
		backdrop-filter: blur(10px);
		border-radius: var(--radius-xl);
		box-sizing: border-box;
		overflow-x: hidden;
	}

	.settings-panel.transparent {
		backdrop-filter: none;
	}

	.settings-panel.expanded {
		transition: opacity 0.3s cubic-bezier(0.35, 1.04, 0.58, 1);
		opacity: 1;
	}

	.settings-content {
		max-width: min(600px, 100%);
		margin: 0 auto;
		width: 100%;
	}

	.settings-groups {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.setting-section {
		margin-bottom: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	/* .section-title {
		margin-bottom: 0.5rem;
		font-size: 1.125rem;
		font-weight: 500;
		color: var(--text-primary);
	} */
</style>
