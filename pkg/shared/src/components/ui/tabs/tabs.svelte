<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui'
	import { cn } from '../../../lib/utils.js'

	let { class: className, value = $bindable(''), onValueChange, ...restProps }: TabsPrimitive.RootProps = $props()
</script>

<TabsPrimitive.Root bind:value {onValueChange} class={cn('w-full', className)} {...restProps} />
