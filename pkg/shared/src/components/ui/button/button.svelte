<script lang="ts">
	import { Button as ButtonPrimitive } from 'bits-ui'
	import type { Snippet } from 'svelte'

	interface Props {
		class?: string
		variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
		size?: 'default' | 'sm' | 'lg' | 'icon'
		disabled?: boolean
		onclick?: (event: MouseEvent) => void
		children?: Snippet
		title?: string
		[key: string]: unknown
	}

	let { class: className, variant = 'default', size = 'default', disabled = false, onclick, children, ...restProps }: Props = $props()
</script>

<!-- svelte-ignore slot_element_deprecated -->
<ButtonPrimitive.Root class="button button-{variant} size-{size} {className || ''}" {disabled} {onclick} {...restProps}>
	{@render children?.()}
</ButtonPrimitive.Root>

<style>
	/* === BUTTON BASE STYLES === */
	:global(.button) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		white-space: nowrap;
		border-radius: var(--radius);
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.2s ease;
		cursor: pointer;
		border: none;
		outline: none;
		text-decoration: none;
	}

	:global(.button:focus-visible) {
		outline: none;
		box-shadow: 0 0 0 2px var(--background), 0 0 0 4px var(--ring);
	}

	:global(.button:disabled) {
		pointer-events: none;
		opacity: 0.5;
	}

	/* === BUTTON VARIANTS === */
	:global(.button-default) {
		background-color: var(--primary);
		color: var(--primary-foreground);
		box-shadow: var(--shadow-sm);
	}

	:global(.button-default:hover:not(:disabled)) {
		background-color: var(--primary-hover);
	}

	:global(.button-destructive) {
		background-color: var(--destructive);
		color: var(--destructive-foreground);
		box-shadow: var(--shadow-sm);
	}

	:global(.button-destructive:hover:not(:disabled)) {
		opacity: 0.9;
	}

	:global(.button-outline) {
		border: 1px solid var(--border);
		background-color: var(--background);
		color: var(--foreground);
		box-shadow: var(--shadow-sm);
	}

	:global(.button-outline:hover:not(:disabled)) {
		background-color: var(--accent);
		color: var(--accent-foreground);
	}

	:global(.button-secondary) {
		background-color: var(--secondary);
		color: var(--secondary-foreground);
		box-shadow: var(--shadow-sm);
	}

	:global(.button-secondary:hover:not(:disabled)) {
		background-color: var(--secondary-hover);
	}

	:global(.button-ghost) {
		background-color: transparent;
		color: var(--foreground);
	}

	:global(.button-ghost:hover:not(:disabled)) {
		background-color: var(--accent);
		color: var(--accent-foreground);
	}

	:global(.button-link) {
		background-color: transparent;
		color: var(--primary);
		text-decoration: underline;
		text-underline-offset: 4px;
	}

	:global(.button-link:hover:not(:disabled)) {
		text-decoration: underline;
	}

	/* === BUTTON SIZES === */
	:global(.size-default) {
		height: 2.25rem;
		padding: 0.5rem 1rem;
	}

	:global(.size-sm) {
		height: 2rem;
		padding: 0 0.75rem;
		font-size: 0.75rem;
	}

	:global(.size-lg) {
		height: 2.5rem;
		padding: 0 2rem;
	}

	:global(.size-icon) {
		height: 2.25rem;
		width: 2.25rem;
		padding: 0;
	}
</style>
