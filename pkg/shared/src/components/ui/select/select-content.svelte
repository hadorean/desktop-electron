<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui'
	import { cn, type WithoutChild } from '../../../lib/utils'
	import SelectScrollDownButton from './select-scroll-down-button.svelte'
	import SelectScrollUpButton from './select-scroll-up-button.svelte'

	let {
		ref = $bindable(null),
		class: className,
		sideOffset = 4,
		portalProps,
		children,
		...restProps
	}: WithoutChild<SelectPrimitive.ContentProps> & {
		portalProps?: SelectPrimitive.PortalProps
	} = $props()
</script>

<SelectPrimitive.Portal {...portalProps}>
	<SelectPrimitive.Content bind:ref {sideOffset} data-slot="select-content" class={cn('select-content', className)} {...restProps}>
		<SelectScrollUpButton />
		<SelectPrimitive.Viewport class="select-viewport">
			{@render children?.()}
		</SelectPrimitive.Viewport>
		<SelectScrollDownButton />
	</SelectPrimitive.Content>
</SelectPrimitive.Portal>

<style>
	.select-content {
		position: relative;
		z-index: 50;
		min-width: 8rem;
		max-height: var(--bits-select-content-available-height);
		overflow-y: auto;
		overflow-x: hidden;
		border-radius: var(--radius);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--popover));
		color: hsl(var(--popover-foreground));
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
		transform-origin: var(--bits-select-content-transform-origin);
	}

	.select-content[data-state='open'] {
		animation: select-in 150ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	.select-content[data-state='closed'] {
		animation: select-out 100ms ease-in;
	}

	.select-content[data-side='bottom'] {
		transform: translateY(0.25rem);
	}

	.select-content[data-side='left'] {
		transform: translateX(-0.25rem);
	}

	.select-content[data-side='right'] {
		transform: translateX(0.25rem);
	}

	.select-content[data-side='top'] {
		transform: translateY(-0.25rem);
	}

	.select-viewport {
		width: 100%;
		min-width: var(--bits-select-anchor-width);
		height: var(--bits-select-anchor-height);
		padding: 0.25rem;
		scroll-margin: 0.25rem 0;
	}

	@keyframes select-in {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes select-out {
		from {
			opacity: 1;
			transform: scale(1);
		}
		to {
			opacity: 0;
			transform: scale(0.95);
		}
	}
</style>
