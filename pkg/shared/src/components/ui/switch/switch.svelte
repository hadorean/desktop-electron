<script lang="ts">
	import { cn } from '../../../lib/utils.js'

	interface Props {
		class?: string
		checked?: boolean
		disabled?: boolean
		onCheckedChange?: (checked: boolean) => void
		id?: string
	}

	let { class: className, checked = $bindable(false), disabled = false, onCheckedChange, id, ...restProps }: Props = $props()

	function handleClick(): void {
		if (disabled) return
		checked = !checked
		onCheckedChange?.(checked)
	}

	function handleKeydown(e: KeyboardEvent): void {
		if (disabled) return
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault()
			handleClick()
		}
	}
</script>

<button
	role="switch"
	aria-checked={checked}
	{disabled}
	{id}
	onclick={handleClick}
	onkeydown={handleKeydown}
	class={cn(
		'focus-visible:ring-ring focus-visible:ring-offset-background relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
		checked ? 'bg-primary' : 'bg-input',
		className
	)}
	{...restProps}
>
	<!-- Thumb -->
	<div
		class="bg-background pointer-events-none absolute block h-4 w-4 rounded-full shadow-lg ring-0 transition-all duration-200 ease-in-out"
		style="top: 50%; left: {checked ? '16px' : '2px'}; transform: translateY(-50%);"
	></div>
</button>
