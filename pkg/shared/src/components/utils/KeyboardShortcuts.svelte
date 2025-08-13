<script lang="ts">
	import { onMount } from 'svelte'

	interface Shortcut {
		key: string
		action: () => void
		description?: string
	}

	interface Props {
		shortcuts: Shortcut[]
	}

	let { shortcuts }: Props = $props()

	function handleKeydown(event: KeyboardEvent): void {
		const shortcut = shortcuts.find((s) => s.key === event.key)
		if (shortcut) {
			event.preventDefault()
			shortcut.action()
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
