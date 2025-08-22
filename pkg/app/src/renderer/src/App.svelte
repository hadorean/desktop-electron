<script lang="ts">
	import KeyboardShortcut from '$shared/components/utils/KeyboardShortcut.svelte'
	import { api, imagesService } from '$shared/services'
	import { imagesStore } from '$shared/stores/imagesStore'
	import { userOptionsStore } from '$shared/stores/userOptionsStore'
	import { onMount } from 'svelte'
	import { CustomHeader, OptionsPage, PageContainer } from './components'
	import SettingsPage from './components/SettingsPage.svelte'
	import { init } from './services/app'
	import { appConfig } from './stores/appConfigStore'
	import { currentPage, gotoPage } from './stores/pageStore'

	let transparent = $state(false)

	onMount(async () => {
		await init()

		appConfig.subscribe(config => {
			transparent = config?.window.transparent ?? false
		})
		const images = await api.getImages()
		await imagesStore.loadImages(images)
		imagesService.initializeImageChangeHandling('Desktop app')
	})

	function togglePage(): void {
		if ($currentPage === 'main') {
			gotoPage('options')
		} else {
			gotoPage('main')
		}
	}

	const { userOptions } = userOptionsStore
</script>

<KeyboardShortcut key="Escape" action={togglePage} />

<div class:transparent class="flex h-full flex-col" style="--opacity: {transparent ? $userOptions.windowOpacity : 1}">
	{#if transparent}
		<CustomHeader />
	{/if}

	<PageContainer {transparent} class="drag flex-1">
		{#snippet settingsContent()}
			<SettingsPage {transparent} />
		{/snippet}

		{#snippet optionsContent()}
			<OptionsPage {transparent} onBack={() => gotoPage('main')} />
		{/snippet}
	</PageContainer>
</div>

<style>
	.transparent {
		--opacity: 1;
		background-color: rgba(22, 22, 22, var(--opacity));
		border: 1px solid rgba(58, 58, 58, var(--opacity));
		border-radius: 10px;
		height: 100vh;
	}
</style>
