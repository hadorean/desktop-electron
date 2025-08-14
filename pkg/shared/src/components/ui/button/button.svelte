<script lang="ts">
	import { Button as ButtonPrimitive } from 'bits-ui'
	import type { Snippet } from 'svelte'

	interface Props {
		class?: string
		variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
		size?: 'default' | 'sm' | 'lg' | 'icon'
		disabled?: boolean
		onclick?: (event: MouseEvent) => void
		children?: Snippet
		title?: string
		[key: string]: unknown
	}

	let { class: className, variant = 'default', size = 'default', disabled = false, onclick, children, ...restProps }: Props = $props()
</script>

<!-- svelte-ignore slot_element_deprecated -->
<ButtonPrimitive.Root class="button button-{variant} size-{size} {className || ''}" {disabled} {onclick} {...restProps}>
	{@render children?.()}
</ButtonPrimitive.Root>
