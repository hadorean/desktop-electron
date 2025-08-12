<script lang="ts">
	interface Props {
		onclick?: () => void
		class?: string
		size?: 'sm' | 'md' | 'lg'
	}

	let { onclick, class: className = '', size = 'md', ...restProps }: Props = $props()
</script>

<button class="back-button {size} {className}" {onclick} {...restProps}>
	<!-- Arrow Left Icon -->
	<svg class="back-icon {size}" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Back">
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
	</svg>
</button>

<style>
	.back-button {
		left: 1rem;
		top: 1rem;
		border-radius: 50%;
		padding: 0;
		color: #e5e5e5; /* text-gray-200 */
		background-color: transparent;
		border: none;
		transition: all 0.2s ease;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		-webkit-app-region: no-drag;
	}

	.back-button:hover {
		background-color: rgba(55, 65, 81, 0.8); /* bg-gray-700/80 */
		color: white;
	}

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

	/* Icon sizes */
	.back-icon.sm {
		width: 1rem; /* w-4 */
		height: 1rem; /* h-4 */
	}

	.back-icon.md {
		width: 1.25rem; /* w-5 */
		height: 1.25rem; /* h-5 */
	}

	.back-icon.lg {
		width: 1.5rem; /* w-6 */
		height: 1.5rem; /* h-6 */
	}
</style>
