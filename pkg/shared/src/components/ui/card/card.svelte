<script lang="ts">
	import { cn } from '../../../lib/utils.js'
	import type { Snippet } from 'svelte'

	let {
		class: className,
		children,
		...restProps
	} = $props<{
		class?: string
		children?: Snippet
		[key: string]: unknown
	}>()
</script>

<div class={cn('bg-card text-card-foreground rounded-lg border shadow-sm', className)} {...restProps}>
	{@render children?.()}
</div>
