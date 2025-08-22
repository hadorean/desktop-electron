<script lang="ts">
	import { Inspect } from '@hgrandry/dbg'
	import { onMount } from 'svelte'
	import { get } from 'svelte/store'
	import { settingsStore } from '../../stores/settingsStore'
	import { imageBackground, type TransitionSettings } from '../../types/settings'
	import { when } from '../../utils/scope'
	import Fadein from '../utils/Fadein.svelte'
	import KeyboardShortcut from '../utils/KeyboardShortcut.svelte'
	import ImageGrid from './ImageGrid.svelte'
	import ScreenSwitcher from './ScreenSwitcher.svelte'
	import SliderControl from './SliderControl.svelte'
	import ToggleControl from './ToggleControl.svelte'
	import UrlInput from './UrlInput.svelte'

	// Props
	let {
		expanded = false,
		transparent = false,
		settingsPanel = $bindable()
	} = $props<{
		expanded?: boolean
		transparent?: boolean
		settingsPanel?: HTMLElement | null
	}>()

	// Reference to ScreenSwitcher component
	let screenSwitcher: ScreenSwitcher

	const {
		screenProfile,
		activeProfile,
		baseProfile,
		isLocalMode,
		currentScreen,
		currentScreenId,
		currentScreenType,
		transition
	} = settingsStore

	function switchScreen(event: KeyboardEvent): void {
		if (expanded && settingsPanel) {
			// Switch screens based on direction
			const direction = event.shiftKey ? 'backward' : 'forward'
			screenSwitcher?.switchToNextScreen(direction)
		}
	}

	function updateTransitionableProfile<K extends keyof typeof $activeProfile & keyof TransitionSettings>(
		key: K,
		value: (typeof $activeProfile)[K] | null
	): void {
		settingsStore.updateTransition(key, 0)
		updateProfile(key, value)
	}

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

	let showContent = $state(false)

	onMount(() => {
		return when([currentScreen], () => {
			showContent = get(currentScreenType) !== 'static' || get(currentScreen).monitorEnabled
		})
	})
</script>

<!-- <Logger input={transition} /> -->

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
			<Fadein visible={showContent}>
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
						onChange={(newValue: number | null) => updateTransitionableProfile('brightness', newValue)}
						formatValue={(v: number) => v.toFixed(2)}
						isOverride={$isLocalMode}
						defaultValue={$baseProfile.brightness}
						overrideValue={$activeProfile.brightness}
						transition={$transition.brightness}
						getTransition={t => t.brightness}
					/>

					<SliderControl
						label="Saturation"
						value={$activeProfile.saturation ?? null}
						min={0}
						max={2}
						step={0.01}
						onChange={(newValue: number | null) => updateTransitionableProfile('saturation', newValue)}
						formatValue={(v: number) => v.toFixed(2)}
						isOverride={$isLocalMode}
						defaultValue={$baseProfile.saturation}
						overrideValue={$activeProfile.saturation}
						transition={$transition.saturation}
						getTransition={t => t.saturation}
					/>

					<SliderControl
						label="Blur"
						value={$activeProfile.blur ?? null}
						min={0}
						max={50}
						step={0.1}
						onChange={(newBlur: number | null) => updateTransitionableProfile('blur', newBlur)}
						formatValue={(v: number) => `${v.toFixed(1)}px`}
						isOverride={$isLocalMode}
						defaultValue={$baseProfile.blur}
						overrideValue={$activeProfile.blur}
						transition={$transition.blur}
						getTransition={t => t.blur}
					/>

					<SliderControl
						label="Transition Time"
						value={$activeProfile.transitionTime ?? null}
						min={0}
						max={10}
						step={0.1}
						onChange={(newValue: number | null) => updateTransitionableProfile('transitionTime', newValue)}
						formatValue={(v: number) => `${v.toFixed(1)}s`}
						isOverride={$isLocalMode}
						defaultValue={$baseProfile.transitionTime}
						overrideValue={$activeProfile.transitionTime}
						transition={$transition.transitionTime}
						getTransition={t => t.transitionTime}
					/>
				</div>

				<div class="setting-section">
					<ToggleControl
						label="Time and date"
						checked={$activeProfile.showTimeDate ?? $screenProfile.showTimeDate ?? true}
						onChange={(newValue: boolean | null) => updateProfile('showTimeDate', newValue)}
						isOverride={$isLocalMode}
						overrideValue={$activeProfile.showTimeDate}
						defaultValue={$baseProfile.showTimeDate}
					/>
					<!-- 
				<ToggleControl
					label="Weather"
					checked={$activeProfile.showWeather ?? $screenProfile.showWeather ?? false}
					onChange={(newValue: boolean | null) => updateProfile('showWeather', newValue)}
					isOverride={$isLocalMode}
					overrideValue={$activeProfile.showWeather}
					defaultValue={$baseProfile.showWeather}
				/> -->
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
				</div>
			</Fadein>

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
	}

	.setting-section {
		margin-bottom: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	/* .section-title {
		margin-bottom: 0.5rem;
		font-size: 1.125rem;
		font-weight: 500;
		color: var(--text-primary);
	} */
</style>
