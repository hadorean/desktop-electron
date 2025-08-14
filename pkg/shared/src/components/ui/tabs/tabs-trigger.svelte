<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui'

	let { class: className, value, disabled = false, ...restProps }: TabsPrimitive.TriggerProps = $props()
</script>

<TabsPrimitive.Trigger {value} {disabled} data-slot="tabs-trigger" class={className} {...restProps} />
