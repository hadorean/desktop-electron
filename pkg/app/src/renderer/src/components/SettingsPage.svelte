<script lang="ts">
	import { ErrorMessage, SettingsPanel, SettingsServerUpdate } from '$shared'
	import { debugMenu } from '$shared/stores/debugStore'
	import { imagesStore } from '$shared/stores/imagesStore'
	import { DebugMenu } from '@hgrandry/dbg'
	import { ActionButtons, AppVersion, OptionsButton, ServerInfo, Versions } from '../components'
	import { currentPage, gotoPage } from '../stores/pageStore'

	const disabled = true

	export let transparent = false

	const { error: imagesError } = imagesStore
	const { visibility: debugVisible } = debugMenu
</script>

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
			<DebugMenu visible={$debugVisible} align="bottom-left" margin={{ x: '1.5rem', y: '1.5rem' }} />
		</footer>
	{/if}
</div>

<style>
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
