<script context="module" lang="ts">
	import { Scope } from '../../utils/scope'
	export type { Scope } from '../../utils/scope'
</script>

<script lang="ts">
	import { onDestroy, onMount } from 'svelte'

	export let init: (scope: Scope) => void
	let scope: Scope = new Scope()

	onMount(() => {
		init(scope)
	})

	onDestroy(() => {
		scope.cleanup()
	})
</script>
