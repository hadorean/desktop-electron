<script lang="ts">
	import { cn } from '../../../lib/utils.js'

	interface Props {
		class?: string
		value?: number[]
		max?: number
		min?: number
		step?: number
		disabled?: boolean
		onValueChange?: (value: number[]) => void
	}

	let { class: className, value = $bindable([0]), max = 100, min = 0, step = 1, disabled = false, onValueChange, ...restProps }: Props = $props()

	let sliderRef: HTMLInputElement
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let isDragging = $state(false)

	const currentValue = $derived(value[0] ?? 0)
	const percentage = $derived(((currentValue - min) / (max - min)) * 100)

	function handleInput(e: Event): void {
		const target = e.target as HTMLInputElement
		const newValue = [parseFloat(target.value)]
		value = newValue
		if (onValueChange) {
			onValueChange(newValue)
		}
	}

	function handleMouseDown(): void {
		isDragging = true

		// Add global listeners to handle mouse up outside the slider
		const handleGlobalMouseUp = (): void => {
			isDragging = false
			document.removeEventListener('mouseup', handleGlobalMouseUp)
		}
		document.addEventListener('mouseup', handleGlobalMouseUp)
	}

	function handleMouseUp(): void {
		isDragging = false
	}

	function handleTouchStart(): void {
		isDragging = true

		// Add global listeners to handle touch end outside the slider
		const handleGlobalTouchEnd = (): void => {
			isDragging = false
			document.removeEventListener('touchend', handleGlobalTouchEnd)
		}
		document.addEventListener('touchend', handleGlobalTouchEnd)
	}

	function handleTouchEnd(): void {
		isDragging = false
	}
</script>

<div class={cn('relative flex w-full touch-none select-none items-center', className)} {...restProps}>
	<!-- Track -->
	<div class="bg-secondary relative h-2 w-full rounded-full">
		<!-- Progress fill -->
		<div
			class={cn(
				'bg-primary absolute h-2 rounded-full'
				// isDragging ? "" : "transition-all duration-200"  // Disabled for now
			)}
			style="width: {percentage}%"
		></div>
		<!-- Slider input -->
		<input
			bind:this={sliderRef}
			type="range"
			{min}
			{max}
			{step}
			{disabled}
			value={currentValue}
			oninput={handleInput}
			onmousedown={handleMouseDown}
			onmouseup={handleMouseUp}
			ontouchstart={handleTouchStart}
			ontouchend={handleTouchEnd}
			class="absolute inset-0 h-2 w-full cursor-pointer appearance-none opacity-0"
		/>
		<!-- Thumb -->
		<div
			class={cn(
				'bg-background border-primary absolute h-4 w-4 -translate-y-1 transform cursor-pointer rounded-full border-2 shadow-lg'
				// isDragging ? "" : "transition-all duration-200"  // Disabled for now
			)}
			style="left: calc({percentage}% - 8px)"
		></div>
	</div>
</div>

<style>
	/* Remove default input styling */
	input[type='range']::-webkit-slider-thumb {
		appearance: none;
		width: 0;
		height: 0;
	}

	input[type='range']::-moz-range-thumb {
		appearance: none;
		width: 0;
		height: 0;
		border: none;
		background: transparent;
	}

	input[type='range']::-webkit-slider-track {
		appearance: none;
		background: transparent;
		border: none;
	}

	input[type='range']::-moz-range-track {
		appearance: none;
		background: transparent;
		border: none;
	}
</style>
