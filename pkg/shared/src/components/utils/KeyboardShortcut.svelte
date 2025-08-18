<script lang="ts">
	import { onMount } from 'svelte'

	interface Props {
		key: string
		action: ((e: KeyboardEvent) => void) | (() => void)
		description?: string
		preventDefault?: boolean
	}

	let { key, action, preventDefault }: Props = $props()

	function handleKeydown(event: KeyboardEvent): void {
		if (key == event.key) {
			if (preventDefault) {
				event.preventDefault()
			}
			action(event)
		}
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeydown)

		return () => {
			document.removeEventListener('keydown', handleKeydown)
		}
	})
</script>

<!-- This component doesn't render anything, it just handles keyboard events -->
