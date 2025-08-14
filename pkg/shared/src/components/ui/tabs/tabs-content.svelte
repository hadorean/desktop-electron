<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui'

	let { class: className, value, ...restProps }: TabsPrimitive.ContentProps = $props()
</script>

<TabsPrimitive.Content {value} class="tabs-content {className || ''}" {...restProps} />

<style>
	:global(.tabs-content) {
		margin-top: 0.5rem;
		outline: none;
	}

	:global(.tabs-content:focus-visible) {
		outline: none;
		box-shadow:
			0 0 0 2px var(--background),
			0 0 0 4px var(--ring);
	}
</style>
