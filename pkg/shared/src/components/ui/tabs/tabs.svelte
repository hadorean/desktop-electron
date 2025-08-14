<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui'

	let { class: className, value = $bindable(''), onValueChange, ...restProps }: TabsPrimitive.RootProps = $props()
</script>

<TabsPrimitive.Root bind:value {onValueChange} class="tabs {className || ''}" {...restProps} />
