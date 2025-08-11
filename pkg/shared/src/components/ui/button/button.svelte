<script lang="ts">
	import { Button as ButtonPrimitive } from 'bits-ui';
	import { buttonVariants, type Variant, type Size } from './index.js';
	import { cn } from '../../../lib/utils.js';
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		variant?: Variant;
		size?: Size;
		disabled?: boolean;
		onclick?: (event: MouseEvent) => void;
		children?: Snippet;
	}

	let { class: className, variant = 'default', size = 'default', disabled = false, onclick, children, ...restProps }: Props = $props();
</script>

<!-- svelte-ignore slot_element_deprecated -->
<ButtonPrimitive.Root class={cn(buttonVariants({ variant, size }), className)} {disabled} {onclick} {...restProps}>
	{@render children?.()}
</ButtonPrimitive.Root>
