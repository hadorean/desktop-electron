<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "../../../lib/utils.js";

	interface Props {
		class?: string;
		value?: string;
		onValueChange?: (value: string) => void;
	}

	let {
		class: className,
		value = $bindable(""),
		onValueChange,
		...restProps
	}: Props = $props();
</script>

<TabsPrimitive.Root
	bind:value
	{onValueChange}
	class={cn("w-full", className)}
	{...restProps}
>
	<slot />
</TabsPrimitive.Root>