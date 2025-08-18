<script lang="ts">
	import { settingsStore } from '../../stores/settingsStore'
	import { Icon } from '../ui'

	export let hideButton: boolean = false
	export let onToggle: () => void
	export let buttonRef: HTMLElement | null = null

	const { screenSettings } = settingsStore

	let buttonHovered: boolean = false

	$: position = $screenSettings.settingsButtonPosition ?? 'bottom-right'
	$: positionClasses = {
		'bottom-right': 'bottom-4 right-4',
		'top-right': 'top-4 right-4',
		'bottom-left': 'bottom-4 left-4',
		'top-left': 'top-4 left-4'
	}[position]

	function handleButtonMouseEnter(): void {
		buttonHovered = true
	}

	function handleButtonMouseLeave(): void {
		buttonHovered = false
	}
</script>

<button
	class="settings-btn {hideButton && !buttonHovered ? 'hidden' : 'visible'} {positionClasses}"
	on:click={onToggle}
	on:mouseenter={handleButtonMouseEnter}
	on:mouseleave={handleButtonMouseLeave}
	bind:this={buttonRef}
	aria-label="Settings"
>
	<Icon name="cog" size="md" />
</button>

<style>
	.settings-btn {
		position: absolute;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		right: 1rem;
		bottom: 1rem;
		color: var(--text-primary);
		background: none;
		border: none;
		outline: none;
		cursor: pointer;
		transition: opacity 0.3s ease;
	}

	.settings-btn:focus {
		outline: none;
		box-shadow: none;
		border: none;
	}

	.settings-btn.hidden {
		opacity: 0;
	}

	.settings-btn.visible {
		opacity: 1;
	}

	/* Tailwind positioning classes */
	:global(.bottom-right) {
		bottom: 1rem;
		right: 1rem;
	}
	:global(.top-right) {
		top: 1rem;
		right: 1rem;
	}
	:global(.bottom-left) {
		bottom: 1rem;
		left: 1rem;
	}
	:global(.top-left) {
		top: 1rem;
		left: 1rem;
	}
</style>
