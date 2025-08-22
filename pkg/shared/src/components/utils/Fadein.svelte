<script lang="ts">
	import type { Snippet } from 'svelte'
	import { onMount } from 'svelte'

	let {
		children,
		visible = false,
		transition = 0.8,
		delay = 0.3
	} = $props<{
		children: Snippet
		visible: boolean
		transition?: number
		delay?: number
	}>()

	let shouldShow = $state(false)

	onMount(() => {
		if (visible) {
			shouldShow = true
		}
	})

	$effect(() => {
		if (visible) {
			shouldShow = true
		} else {
			shouldShow = false
		}
	})
</script>

<div class="fadein" class:visible={shouldShow} style="--delay: {delay}s; --transition: {transition}s">
	{@render children()}
</div>

<style>
	.fadein {
		overflow: hidden;
		max-height: 0px;
		opacity: 0;
		transition:
			max-height var(--transition) cubic-bezier(0.4, 0, 0.2, 1),
			opacity var(--transition) cubic-bezier(0.4, 0, 0.2, 1);
		transition-delay: var(--delay), calc((var(--delay) + 500)); /* Height first, then opacity */
	}

	.fadein.visible {
		opacity: 1;
		max-height: 1000px; /* Large enough to accommodate most content */
		transition-delay: calc(var(--delay) * 1ms), calc((var(--delay) + 500) * 1ms); /* Height first, then opacity */
	}
</style>
