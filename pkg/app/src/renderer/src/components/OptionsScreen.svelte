<script lang="ts">
	import { KeyboardShortcuts } from '$shared'
	import cogIcon from '../assets/cog.svg?url'
	import AppVersion from './AppVersion.svelte'
	import BackButton from './BackButton.svelte'

	interface Props {
		transparent?: boolean
		class?: string
		onBack?: () => void
	}

	let { class: className = '', onBack, ...restProps }: Props = $props()
</script>

<KeyboardShortcuts shortcuts={[{ key: 'Escape', action: onBack }]} />

<div class="options-screen {className}" {...restProps}>
	<!-- Back Button -->
	{#if onBack}
		<BackButton onclick={onBack} />
	{/if}

	<div class="text-center">
		<div class="mb-4 flex items-center justify-center gap-3">
			<img src={cogIcon} alt="Settings" class="cog-icon" />
			<h1 class="text-4xl font-bold text-white">Options</h1>
		</div>
		<p class="text-gray-400">Configuration options will be added here.</p>
	</div>
	<AppVersion />
</div>

<style>
	/* Ensure text elements are draggable when in transparent mode */
	h1,
	p {
		-webkit-app-region: drag;
	}

	.options-screen {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		height: 100%;
		width: 100%;
	}

	.cog-icon {
		width: 2rem;
		height: 2rem;
		transform: translateY(2px);
		-webkit-app-region: drag;
	}
</style>
