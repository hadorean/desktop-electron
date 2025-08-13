<script lang="ts">
	import cogIcon from '../assets/cog.svg?url'

	interface Props {
		onclick?: () => void
		class?: string
		size?: 'sm' | 'md' | 'lg'
	}

	let { onclick, class: className = '', size = 'lg', ...restProps }: Props = $props()
</script>

<button class="options-button {size} {className}" {onclick} {...restProps}>
	<img src={cogIcon} alt="Options" class="options-icon {size}" />
</button>

<style>
	.options-button {
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		border-radius: 50%;
		padding: 0;
		color: hsl(222.2, 84%, 4.9%); /* secondary button text */
		transition: all 0.2s ease;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		-webkit-app-region: no-drag;
	}

	.options-button:hover {
		background-color: hsla(210, 40%, 96%, 0.05); /* secondary button hover */
	}

	/* Size variants */
	.options-button.sm {
		width: 2rem; /* w-8 */
		height: 2rem; /* h-8 */
	}

	.options-button.md {
		width: 2.5rem; /* w-10 */
		height: 2.5rem; /* h-10 */
	}

	.options-button.lg {
		width: 3rem; /* w-12 */
		height: 3rem; /* h-12 */
	}

	/* Icon sizes */
	.options-icon.sm {
		width: 1rem; /* w-4 */
		height: 1rem; /* h-4 */
	}

	.options-icon.md {
		width: 1.25rem; /* w-5 */
		height: 1.25rem; /* h-5 */
	}

	.options-icon.lg {
		width: 1.5rem; /* w-6 */
		height: 1.5rem; /* h-6 */
	}

	.options-icon {
		color: #e5e5e5; /* text-gray-200 */
		filter: brightness(0) saturate(100%) invert(90%) sepia(5%) saturate(140%) hue-rotate(202deg) brightness(95%) contrast(86%);
	}
</style>
