<script lang="ts">
	import { cn } from "../../../lib/utils.js";

	interface Props {
		class?: string;
	}

	let {
		class: className,
		...restProps
	}: Props = $props();
</script>

<div
	class={cn("p-6 pt-0", className)}
	{...restProps}
>
	<slot />
</div>