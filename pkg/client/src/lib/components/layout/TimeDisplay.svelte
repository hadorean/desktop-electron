<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	// Props
	let currentTime: string = '';
	let currentDate: string = '';
	let interval: NodeJS.Timeout | undefined;
	let opacity = new Tween(0, {
		duration: 3000,
		easing: cubicOut
	});

	// Function to update the current time and greeting
	function updateTime() {
		const now = new Date();
		const hours = now.getHours().toString().padStart(2, '0');
		const minutes = now.getMinutes().toString().padStart(2, '0');
		currentTime = `${hours}:${minutes}`;

		// Format the date
		const options: Intl.DateTimeFormatOptions = {
			weekday: 'long',
			month: 'long',
			day: 'numeric'
		};
		currentDate = now.toLocaleDateString('en-US', options);
	}

	// Watch for showTimeDate changes
	onMount(() => {
		updateTime();
		opacity.set(1);
		interval = setInterval(updateTime, 1000);
	});

	// Clean up on component destruction
	onDestroy(() => {
		if (interval) {
			clearInterval(interval);
		}
	});
</script>

<div
	class="absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1 transform text-center text-white"
	style="opacity: {opacity.current};"
>
	<h1 class="text-shadow-lg mb-2 text-8xl font-thin">{currentTime}</h1>
	<h2 class="text-shadow-lg mb-4 text-2xl font-light">{currentDate}</h2>
</div>

<style>
	.text-shadow-lg {
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
	}
</style>
