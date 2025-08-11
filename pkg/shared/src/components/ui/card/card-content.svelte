<script lang="ts">
	import { cn } from '../../../lib/utils.js';

	let {
		class: className,
		children,
		...restProps
	} = $props<{
		class?: string;
		children?: import('svelte').Snippet;
		[key: string]: unknown;
	}>();
</script>

<div class={cn('p-6 pt-0', className)} {...restProps}>
	{@render children?.()}
</div>
