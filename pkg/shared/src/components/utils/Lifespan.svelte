<script context="module" lang="ts">
	import { Scope } from '../../utils/scope'
	export { Scope } from '../../utils/scope'
</script>

<script lang="ts">
	import { onDestroy, onMount } from 'svelte'

	export let init: (scope: Scope) => void
	export let cleanup: ((scope: Scope) => void) | null = null

	let scope: Scope = new Scope()

	onMount(() => {
		init(scope)
	})

	onDestroy(() => {
		scope.cleanup()
		cleanup?.(scope)
	})
</script>
