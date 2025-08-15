<script lang="ts">
	import { ErrorMessage, KeyboardShortcuts, SettingsPanel, SettingsServerUpdate } from '$shared'
	import { initializeImageChangeHandling } from '$shared/services'
	import { debugVisible, effectiveApiUrl, imagesError, loadImages, userOptions } from '$shared/stores'
	import { DebugMenu } from '@hgrandry/dbg'
	import { onMount } from 'svelte'
	import { ActionButtons, AppVersion, CustomHeader, OptionsButton, OptionsScreen, PageContainer, ServerInfo, Versions } from './components'
	import { init } from './services/app'
	import { appConfig } from './stores/appConfigStore'
	import { currentPage, gotoPage } from './stores/pageStore'

	const disabled = true

	let transparent = $state(false)

	onMount(async () => {
		await init()

		appConfig.subscribe((config) => {
			transparent = config?.window.transparent ?? false
		})
		effectiveApiUrl.set('http://localhost:8080')
		await loadImages()
		initializeImageChangeHandling('Desktop app')
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

<div class:transparent class="flex h-full flex-col" style="--opacity: {transparent ? $userOptions.windowOpacity : 1}">
	{#if transparent}
		<CustomHeader />
	{/if}

	<PageContainer {transparent} class="drag flex-1">
		{#snippet settingsContent()}
			<div class="settings-container drag">
				<SettingsPanel expanded={true} {transparent} />
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
			<OptionsScreen {transparent} onBack={() => gotoPage('main')} />
		{/snippet}
	</PageContainer>

	<DebugMenu visible={$debugVisible} align="bottom-right" margin={{ x: '1rem', y: '3rem' }} />
</div>

<style>
	.transparent {
		--opacity: 1;
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
		padding: 1rem;
	}

	footer {
		margin-top: auto;
		padding: 0.5rem;
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		align-items: center;
		z-index: 99999;
	}
</style>
