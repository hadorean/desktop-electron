<script lang="ts">
	interface Props {
		class?: string
		value?: number[]
		max?: number
		min?: number
		step?: number
		disabled?: boolean
		onValueChange?: (value: number[]) => void
	}

	let {
		class: className,
		value = $bindable([0]),
		max = 100,
		min = 0,
		step = 1,
		disabled = false,
		onValueChange,
		...restProps
	}: Props = $props()

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

<div class="slider-container {className || ''}" {...restProps}>
	<!-- Track -->
	<div class="slider-track">
		<!-- Progress fill -->
		<div class="slider-progress" style="width: {percentage}%"></div>
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
			class="slider-input"
		/>
		<!-- Thumb -->
		<div class="slider-thumb" style="left: calc({percentage}% - 8px)"></div>
	</div>
</div>

<style>
	/* === SLIDER COMPONENT STYLES === */
	.slider-container {
		position: relative;
		display: flex;
		width: 100%;
		touch-action: none;
		user-select: none;
		align-items: center;
	}

	.slider-track {
		background-color: var(--secondary);
		position: relative;
		height: 0.5rem; /* 8px */
		width: 100%;
		border-radius: var(--radius-xl);
	}

	.slider-progress {
		background-color: var(--primary);
		position: absolute;
		height: 0.5rem; /* 8px */
		border-radius: var(--radius-xl);
	}

	.slider-input {
		position: absolute;
		inset: 0;
		height: 0.5rem; /* 8px */
		width: 100%;
		cursor: pointer;
		appearance: none;
		opacity: 0;
	}

	.slider-input:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.slider-thumb {
		background-color: var(--background);
		border: 2px solid var(--primary);
		position: absolute;
		height: 1rem; /* 16px */
		width: 1rem; /* 16px */
		transform: translateY(-4px); /* Center vertically */
		cursor: pointer;
		border-radius: 50%;
		box-shadow: var(--shadow-lg);
		pointer-events: none; /* Allow clicks to pass through to the input underneath */
	}

	.slider-thumb:hover {
		box-shadow:
			var(--shadow-lg),
			0 0 0 4px rgb(var(--primary) / 0.1);
		transform: translateY(-4px) scale(1.1);
	}

	/* Remove default input styling */
	.slider-input::-webkit-slider-thumb {
		appearance: none;
		width: 0;
		height: 0;
	}

	.slider-input::-moz-range-thumb {
		appearance: none;
		width: 0;
		height: 0;
		border: none;
		background: transparent;
	}

	.slider-input::-webkit-slider-track {
		appearance: none;
		background: transparent;
		border: none;
	}

	.slider-input::-moz-range-track {
		appearance: none;
		background: transparent;
		border: none;
	}

	/* Disabled state */
	.slider-container:has(.slider-input:disabled) .slider-track {
		opacity: 0.5;
	}

	.slider-container:has(.slider-input:disabled) .slider-thumb {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.slider-container:has(.slider-input:disabled) .slider-thumb:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-lg);
	}
</style>
