<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "../../../lib/utils.js";

	interface Props {
		class?: string;
		value: string;
	}

	let {
		class: className,
		value,
		...restProps
	}: Props = $props();
</script>

<TabsPrimitive.Content
	{value}
	class={cn(
		"mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
		className
	)}
	{...restProps}
>
	<slot />
</TabsPrimitive.Content>