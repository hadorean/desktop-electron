<script lang="ts">
	import { Button } from '$shared/components/ui'

	interface Props {
		onclick?: () => void
		class?: string
		size?: 'sm' | 'md' | 'lg'
	}

	let { onclick, class: className = '', size = 'md', ...restProps }: Props = $props()

	let buttonSize = $derived(size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10')
	let iconSize = $derived(size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5')
</script>

<Button
	variant="secondary"
	class="fixed bottom-4 right-4 {buttonSize} rounded-full border-gray-600 bg-gray-700/80 p-0 shadow-lg transition-all duration-200 hover:bg-gray-600/80 hover:shadow-xl {className}"
	{onclick}
	{...restProps}
>
	<!-- Cog/Settings Icon -->
	<img src="/src/assets/cog.svg" alt="Options" class="{iconSize} text-gray-200" />
</Button>

<style>
	/* Ensure button is not draggable */
	:global(.fixed) {
		-webkit-app-region: no-drag;
	}
</style>