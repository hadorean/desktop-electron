<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui'

	let { ref = $bindable(null), class: className, ...restProps }: TabsPrimitive.ListProps = $props()
</script>

<TabsPrimitive.List bind:ref data-slot="tabs-list" class="tabs-list {className || ''}" {...restProps} />
