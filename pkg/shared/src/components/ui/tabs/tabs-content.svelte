<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui'

	let { class: className, value, ...restProps }: TabsPrimitive.ContentProps = $props()
</script>

<TabsPrimitive.Content {value} class="tabs-content {className || ''}" {...restProps} />
