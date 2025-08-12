<script lang="ts">
	import { Inspect } from '@hgrandry/dbg'
	import { currentScreen, editingSettings, inTransition, isLocalMode, screenSettings, updateEditingSettings } from '../../stores'
	import ImageGrid from './ImageGrid.svelte'
	import ScreenSwitcher from './ScreenSwitcher.svelte'
	import SliderControl from './SliderControl.svelte'
	import ToggleControl from './ToggleControl.svelte'

	// Props
	export let expanded: boolean = false
	//export let errorMessage: string = "";
	export let settingsPanel: HTMLElement | null = null
	export let transparent: boolean = false
	function handleSettingChange<K extends keyof typeof $editingSettings>(key: K, value: (typeof $editingSettings)[K] | null): void {
		updateEditingSettings((current) => {
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
	<ScreenSwitcher />
	<div class="settings-content">
		<Inspect>
			{#if $isLocalMode}
				Settings - {$currentScreen}
			{:else}
				Settings - Shared
			{/if}
		</Inspect>

		<div class="space-y-6">
			<!-- Image Selection -->
			<div class="setting-section">
				<h3 class="mb-2 text-lg font-medium">Background Image</h3>
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
					defaultValue={$screenSettings.opacity ?? 1}
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
					defaultValue={$screenSettings.saturation ?? 1}
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
					defaultValue={$screenSettings.blur ?? 0}
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
					defaultValue={$screenSettings.transitionTime ?? 1}
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
				defaultValue={$screenSettings.showTimeDate ?? true}
				disabled={$inTransition}
			/>

			<ToggleControl
				label="Weather"
				checked={$editingSettings.showWeather ?? $screenSettings.showWeather ?? false}
				onChange={(newShowWeather: boolean | null) => handleSettingChange('showWeather', newShowWeather)}
				isOverride={$isLocalMode}
				overrideValue={$editingSettings.showWeather}
				defaultValue={$screenSettings.showWeather ?? false}
				disabled={$inTransition}
			/>

			<ToggleControl
				label="Auto-hide settings button"
				checked={$editingSettings.hideButton ?? $screenSettings.hideButton ?? false}
				onChange={(newHideButton: boolean | null) => handleSettingChange('hideButton', newHideButton)}
				isOverride={$isLocalMode}
				overrideValue={$editingSettings.hideButton}
				defaultValue={$screenSettings.hideButton ?? false}
				disabled={$inTransition}
			/>
		</div>
	</div>
</div>

<style>
	.settings-panel {
		padding: 2rem;
		color: white;
		min-width: 450px;
		max-width: 120vw;
		max-height: 90vh;
		overflow-y: auto;
		z-index: 1000;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.9);
		transition: opacity 0.3s cubic-bezier(0.9, 0.14, 1, 0.75);
		opacity: 0;
		backdrop-filter: blur(10px);
		border-radius: 1rem;
	}

	.settings-panel.transparent {
		backdrop-filter: none;
	}

	.settings-panel.expanded {
		transition: opacity 0.3s cubic-bezier(0.35, 1.04, 0.58, 1);
		opacity: 1;
	}

	.settings-content {
		max-width: 600px;
		margin: 0 auto;
	}

	.setting-section {
		margin-bottom: 2rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	/* Scrollbar styling */
	.settings-panel::-webkit-scrollbar {
		width: 8px;
	}

	.settings-panel::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
	}

	.settings-panel::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.3);
		border-radius: 4px;
	}

	.settings-panel::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.4);
	}
</style>
