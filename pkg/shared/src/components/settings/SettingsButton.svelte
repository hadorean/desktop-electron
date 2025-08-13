<script lang="ts">
	import { screenSettings } from '../../stores/settingsStore'

	export let hideButton: boolean = false
	export let buttonHovered: boolean = false
	export let onToggle: () => void
	export let onMouseEnter: () => void
	export let onMouseLeave: () => void
	export let buttonRef: HTMLElement | null = null

	$: position = $screenSettings.settingsButtonPosition ?? 'bottom-right'
	$: positionClasses = {
		'bottom-right': 'bottom-4 right-4',
		'top-right': 'top-4 right-4',
		'bottom-left': 'bottom-4 left-4',
		'top-left': 'top-4 left-4'
	}[position]
</script>

<button
	class="settings-btn {hideButton && !buttonHovered ? 'hidden' : 'visible'} {positionClasses}"
	on:click={onToggle}
	on:mouseenter={onMouseEnter}
	on:mouseleave={onMouseLeave}
	bind:this={buttonRef}
	aria-label="Settings"
>
	<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
			d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
		/>
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
	</svg>
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

	.settings-btn svg {
		width: 24px;
		height: 24px;
	}

	/* Tailwind positioning classes */
	:global(.bottom-right) { bottom: 1rem; right: 1rem; }
	:global(.top-right) { top: 1rem; right: 1rem; }
	:global(.bottom-left) { bottom: 1rem; left: 1rem; }
	:global(.top-left) { top: 1rem; left: 1rem; }
</style>
