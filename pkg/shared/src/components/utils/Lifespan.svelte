<script context="module" lang="ts">
	export class Span extends Scope {}
</script>

<script lang="ts">
	import { onDestroy, onMount } from 'svelte'
	import { Scope } from '../../utils/scope'

	export let init: (scope: Scope) => void
	let scope: Span = new Scope()

	onMount(() => {
		init(scope)
	})

	onDestroy(() => {
		scope.cleanup()
	})
</script>
