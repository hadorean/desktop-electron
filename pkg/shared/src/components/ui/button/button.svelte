<script lang="ts">
	import { Button as ButtonPrimitive } from "bits-ui";
	import { buttonVariants, type Variant, type Size } from "./index.js";
	import { cn } from "../../../lib/utils.js";

	interface Props {
		class?: string;
		variant?: Variant;
		size?: Size;
		disabled?: boolean;
		onclick?: (event: MouseEvent) => void;
	}

	let {
		class: className,
		variant = "default",
		size = "default", 
		disabled = false,
		onclick,
		...restProps
	}: Props = $props();
</script>

<ButtonPrimitive.Root
	class={cn(buttonVariants({ variant, size }), className)}
	{disabled}
	{onclick}
	{...restProps}
>
	<slot />
</ButtonPrimitive.Root>