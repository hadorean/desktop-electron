<script lang="ts">
	import { Inspect } from '@hgrandry/dbg'
	import { settingsStore } from '../../stores/settingsStore'
	import { imageBackground } from '../../types/settings'
	import KeyboardShortcut from '../utils/KeyboardShortcut.svelte'
	import ImageGrid from './ImageGrid.svelte'
	import ScreenSwitcher from './ScreenSwitcher.svelte'
	import SliderControl from './SliderControl.svelte'
	import ToggleControl from './ToggleControl.svelte'
	import UrlInput from './UrlInput.svelte'

	// Props
	export let expanded: boolean = false
	//export let errorMessage: string = "";
	export let settingsPanel: HTMLElement | null = null
	export let transparent: boolean = false

	// Reference to ScreenSwitcher component
	let screenSwitcher: ScreenSwitcher

	const {
		screenProfile,
		activeProfile,
		baseProfile,
		transitionTime,
		isLocalMode,
		currentScreen,
		currentScreenId,
		currentScreenType
	} = settingsStore

	function switchScreen(event: KeyboardEvent): void {
		if (expanded && settingsPanel) {
			// Switch screens based on direction
			const direction = event.shiftKey ? 'backward' : 'forward'
			screenSwitcher?.switchToNextScreen(direction)
		}
	}

	// onMount(() => {
	// 	settingsStore.activeProfile.subscribe(profile => {
	// 		console.log('activeProfile', profile)
	// 	})
	// })

	function updateProfile<K extends keyof typeof $activeProfile>(
		key: K,
		value: (typeof $activeProfile)[K] | null
	): void {
		settingsStore.updateProfile(current => {
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

<KeyboardShortcut key="Tab" action={switchScreen} preventDefault />

<div class="settings-panel" bind:this={settingsPanel} class:expanded class:transparent>
	<ScreenSwitcher bind:this={screenSwitcher} />
	<div class="settings-content">
		<Inspect>
			{#if $isLocalMode}
				Settings - {$currentScreenId}
			{:else}
				Settings - Shared
			{/if}
		</Inspect>

		<div class="settings-groups">
			<!-- Background Selection -->
			<div class="setting-section">
				<!-- Background Mode Selector -->
				<!-- <BackgroundModeSelector
					mode={$activeProfile.mode ?? $screenProfile.mode ?? 'image'}
					onModeChange={(newMode: 'image' | 'url') => handleSettingChange('mode', newMode)}
					canRevert={$isLocalMode && $activeProfile.mode !== undefined}
					onRevert={() => handleSettingChange('mode', null)}
				/> -->

				<!-- Conditional Background Input -->
				{#if $activeProfile.mode == imageBackground}
					<ImageGrid
						selectedImage={$screenProfile.image ?? ''}
						isOverride={$isLocalMode}
						overrideValue={$activeProfile.image}
						onImageChange={(newImage: string | null) => updateProfile('image', newImage)}
					/>
				{:else}
					<UrlInput
						url={$screenProfile.url ?? ''}
						isOverride={$isLocalMode}
						overrideValue={$activeProfile.url}
						onUrlChange={(newUrl: string | null) => updateProfile('url', newUrl)}
					/>
				{/if}

				<SliderControl
					label="Brightness"
					value={$activeProfile.brightness ?? null}
					min={0}
					max={1}
					step={0.01}
					onChange={(newValue: number | null) => updateProfile('brightness', newValue)}
					formatValue={(v: number) => v.toFixed(2)}
					isOverride={$isLocalMode}
					defaultValue={$baseProfile.brightness}
					overrideValue={$activeProfile.brightness}
					transition={$transitionTime}
				/>

				<SliderControl
					label="Saturation"
					value={$activeProfile.saturation ?? null}
					min={0}
					max={2}
					step={0.01}
					onChange={(newValue: number | null) => updateProfile('saturation', newValue)}
					formatValue={(v: number) => v.toFixed(2)}
					isOverride={$isLocalMode}
					defaultValue={$baseProfile.saturation}
					overrideValue={$activeProfile.saturation}
					transition={$transitionTime}
				/>

				<SliderControl
					label="Blur"
					value={$activeProfile.blur ?? null}
					min={0}
					max={50}
					step={0.1}
					onChange={(newBlur: number | null) => updateProfile('blur', newBlur)}
					formatValue={(v: number) => `${v.toFixed(1)}px`}
					isOverride={$isLocalMode}
					defaultValue={$baseProfile.blur}
					overrideValue={$activeProfile.blur}
					transition={$transitionTime}
				/>

				<SliderControl
					label="Transition Time"
					value={$activeProfile.transitionTime ?? null}
					min={0}
					max={10}
					step={0.1}
					onChange={(newValue: number | null) => updateProfile('transitionTime', newValue)}
					formatValue={(v: number) => `${v.toFixed(1)}s`}
					isOverride={$isLocalMode}
					defaultValue={$baseProfile.transitionTime}
					overrideValue={$activeProfile.transitionTime}
					transition={$transitionTime}
				/>
			</div>

			<ToggleControl
				label="Time and date"
				checked={$activeProfile.showTimeDate ?? $screenProfile.showTimeDate ?? true}
				onChange={(newValue: boolean | null) => updateProfile('showTimeDate', newValue)}
				isOverride={$isLocalMode}
				overrideValue={$activeProfile.showTimeDate}
				defaultValue={$baseProfile.showTimeDate}
			/>

			<ToggleControl
				label="Weather"
				checked={$activeProfile.showWeather ?? $screenProfile.showWeather ?? false}
				onChange={(newValue: boolean | null) => updateProfile('showWeather', newValue)}
				isOverride={$isLocalMode}
				overrideValue={$activeProfile.showWeather}
				defaultValue={$baseProfile.showWeather}
			/>

			{#if $currentScreenType === 'interactive'}
				<ToggleControl
					label="Auto-hide settings button"
					checked={$activeProfile.hideButton ?? $screenProfile.hideButton ?? false}
					onChange={(newValue: boolean | null) => updateProfile('hideButton', newValue)}
					isOverride={$isLocalMode}
					overrideValue={$activeProfile.hideButton}
					defaultValue={$baseProfile.hideButton}
				/>
			{/if}

			{#if $currentScreenType === 'static'}
				<ToggleControl
					label="Enable background"
					checked={$currentScreen.monitorEnabled}
					onChange={(newMonitorEnabled: boolean | null) => {
						settingsStore.setMonitorEnabled(newMonitorEnabled ?? true)
					}}
					defaultValue={true}
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
