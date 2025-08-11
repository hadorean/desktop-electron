<script lang="ts">
	import { cn } from '../../../lib/utils.js';
	import type { Snippet } from 'svelte';

	let {
		class: className,
		children,
		...restProps
	} = $props<{
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	}>();
</script>

<div class={cn('flex flex-col space-y-1.5 p-6', className)} {...restProps}>
	{@render children?.()}
</div>
