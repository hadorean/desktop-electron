<script lang="ts">
	import { cn } from '../../../lib/utils.js'
	import { onMount } from 'svelte'

	interface Props {
		class?: string
		checked?: boolean
		disabled?: boolean
		onCheckedChange?: (checked: boolean) => void
		id?: string
	}

	let { class: className, checked = $bindable(false), disabled = false, onCheckedChange, id, ...restProps }: Props = $props()

	let mounted = $state(false)

	// Enable transitions after mount to prevent initial animation
	onMount(() => {
		// Use requestAnimationFrame to ensure DOM is fully rendered
		requestAnimationFrame(() => {
			mounted = true
		})
	})

	function handleClick(): void {
		if (disabled) return
		checked = !checked
		onCheckedChange?.(checked)
	}

	function handleKeydown(e: KeyboardEvent): void {
		if (disabled) return
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault()
			handleClick()
		}
	}
</script>

<button
	role="switch"
	aria-checked={checked}
	{disabled}
	{id}
	onclick={handleClick}
	onkeydown={handleKeydown}
	class="switch-button {checked ? 'switch-checked' : ''} {disabled ? 'switch-disabled' : ''} {className || ''}"
	{...restProps}
>
	<!-- Thumb -->
	<div
		class="switch-thumb {checked ? 'switch-thumb-checked' : ''} {mounted ? 'switch-thumb-mounted' : ''}"
	></div>
</button>

<style>
	/* === SWITCH COMPONENT STYLES === */
	.switch-button {
		/* Base switch styling */
		position: relative;
		display: inline-flex;
		align-items: center;
		height: 1.25rem; /* 20px - h-5 */
		width: 2.25rem; /* 36px - w-9 */
		flex-shrink: 0;
		cursor: pointer;
		border-radius: var(--radius-xl);
		border: 2px solid transparent;
		background-color: var(--input);
		box-shadow: var(--shadow-sm);
		transition: all 0.2s ease;
		
		/* Focus styles */
		outline: none;
	}

	.switch-button:focus-visible {
		outline: none;
		box-shadow: 
			var(--shadow-sm),
			0 0 0 2px var(--background),
			0 0 0 4px var(--ring);
	}

	/* Checked state */
	.switch-button.switch-checked {
		background-color: var(--primary);
	}

	/* Disabled state */
	.switch-button.switch-disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	/* Hover states */
	.switch-button:not(.switch-disabled):hover {
		opacity: 0.9;
	}

	.switch-button.switch-checked:not(.switch-disabled):hover {
		background-color: var(--primary-hover);
	}

	/* Switch thumb */
	.switch-thumb {
		background-color: var(--background);
		pointer-events: none;
		position: absolute;
		top: 50%;
		left: 2px; /* Default unchecked position */
		display: block;
		height: 1rem; /* 16px - h-4 */
		width: 1rem; /* 16px - w-4 */
		border-radius: 50%;
		box-shadow: var(--shadow-lg);
		transform: translateY(-50%);
		/* No transition by default - prevents initial animation */
	}

	/* Checked position */
	.switch-thumb.switch-thumb-checked {
		left: 16px;
	}

	/* Enable transitions only after mount and respect user preferences */
	.switch-thumb.switch-thumb-mounted {
		transition: all 0.2s ease-in-out;
	}

	/* Respect user's motion preferences */
	@media (prefers-reduced-motion: reduce) {
		.switch-thumb.switch-thumb-mounted {
			transition: none;
		}
	}

	/* Thumb hover effect */
	.switch-button:not(.switch-disabled):hover .switch-thumb {
		box-shadow: var(--shadow-lg), 0 0 0 2px rgb(var(--primary) / 0.1);
	}

	/* Active/pressed state */
	.switch-button:not(.switch-disabled):active .switch-thumb {
		transform: translateY(-50%) scale(0.95);
	}

	/* Accessibility improvements */
	.switch-button:focus-visible .switch-thumb {
		box-shadow: var(--shadow-lg), 0 0 0 2px var(--ring);
	}
</style>
