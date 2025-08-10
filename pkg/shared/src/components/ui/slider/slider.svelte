<script lang="ts">
	import { cn } from "../../../lib/utils.js";

	interface Props {
		class?: string;
		value?: number[];
		max?: number;
		min?: number;
		step?: number;
		disabled?: boolean;
		onValueChange?: (value: number[]) => void;
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
	}: Props = $props();

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const newValue = [parseFloat(target.value)];
		value = newValue;
		if (onValueChange) {
			onValueChange(newValue);
		}
	}
</script>

<div class={cn("relative flex w-full touch-none select-none items-center", className)} {...restProps}>
	<input
		type="range"
		{min}
		{max}
		{step}
		{disabled}
		value={value[0]}
		oninput={handleInput}
		class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
	/>
</div>

<style>
	.slider-thumb {
		background: linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) var(--progress, 50%), 
					hsl(var(--primary) / 0.2) var(--progress, 50%), hsl(var(--primary) / 0.2) 100%);
	}

	.slider-thumb::-webkit-slider-thumb {
		appearance: none;
		height: 16px;
		width: 16px;
		border-radius: 50%;
		background: hsl(var(--background));
		border: 2px solid hsl(var(--primary));
		cursor: pointer;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
	}

	.slider-thumb::-moz-range-thumb {
		height: 16px;
		width: 16px;
		border-radius: 50%;
		background: hsl(var(--background));
		border: 2px solid hsl(var(--primary));
		cursor: pointer;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
	}

	.slider-thumb::-webkit-slider-track {
		height: 8px;
		background: transparent;
		border-radius: 4px;
	}

	.slider-thumb::-moz-range-track {
		height: 8px;
		background: transparent;
		border-radius: 4px;
		border: none;
	}
</style>