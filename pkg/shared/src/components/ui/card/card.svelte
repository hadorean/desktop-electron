<script lang="ts">
	import { cn } from '../../../lib/utils.js';

	interface Props {
		class?: string;
		[key: string]: any;
	}

	let { class: className, children, ...restProps }: Props = $props();
</script>

<div class={cn('bg-card text-card-foreground rounded-lg border shadow-sm', className)} {...restProps}>
	{@render children?.()}
</div>
