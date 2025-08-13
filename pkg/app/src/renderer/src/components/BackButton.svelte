<script lang="ts">
	import { Icon } from '$shared/components/ui'

	interface Props {
		onclick?: () => void
		class?: string
		size?: 'sm' | 'md' | 'lg'
	}

	let { onclick, class: className = '', size = 'md', ...restProps }: Props = $props()
</script>

<button class="back-button {size} {className}" {onclick} {...restProps}>
	<Icon name="back-arrow" {size} />
</button>

<style>
	.back-button {
		left: 1rem;
		top: 1rem;
		border-radius: 50%;
		padding: 0;
		margin: 0;
		color: var(--text-secondary);
		background-color: transparent;
		border: none;
		transition: all 0.2s ease;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;
		/* Ensure minimum touch target size */
		min-width: 2.5rem;
		min-height: 2.5rem;
	}

	.back-button:hover {
		background-color: var(--surface-hover);
		color: var(--text-primary);
	}

	/* Icon component now handles pointer-events: none by default */

	/* Size variants */
	.back-button.sm {
		width: 2rem; /* w-8 */
		height: 2rem; /* h-8 */
	}

	.back-button.md {
		width: 2.5rem; /* w-10 */
		height: 2.5rem; /* h-10 */
	}

	.back-button.lg {
		width: 3rem; /* w-12 */
		height: 3rem; /* h-12 */
	}
</style>
