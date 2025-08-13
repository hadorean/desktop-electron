<script lang="ts">
	import { onMount, onDestroy } from 'svelte'
	import { Tween } from 'svelte/motion'
	import { cubicOut } from 'svelte/easing'

	// Props
	let currentTime: string = ''
	let currentDate: string = ''
	let interval: ReturnType<typeof setInterval> | undefined
	let opacity = new Tween(0, {
		duration: 3000,
		easing: cubicOut
	})

	// Function to update the current time and greeting
	function updateTime(): void {
		const now = new Date()
		const hours = now.getHours().toString().padStart(2, '0')
		const minutes = now.getMinutes().toString().padStart(2, '0')
		currentTime = `${hours}:${minutes}`

		// Format the date
		const options: Intl.DateTimeFormatOptions = {
			weekday: 'long',
			month: 'long',
			day: 'numeric'
		}
		currentDate = now.toLocaleDateString('en-US', options)
	}

	// Watch for showTimeDate changes
	onMount(() => {
		updateTime()
		opacity.set(1)
		interval = setInterval(updateTime, 1000)
	})

	// Clean up on component destruction
	onDestroy(() => {
		if (interval) {
			clearInterval(interval)
		}
	})
</script>

<div class="time-display" style="opacity: {opacity.current};">
	<h1 class="time">{currentTime}</h1>
	<h2 class="date">{currentDate}</h2>
</div>

<style>
	.time-display {
		position: absolute;
		left: 50%;
		top: 25%;
		transform: translate(-50%, -50%);
		text-align: center;
		color: var(--text-primary);
	}

	.time {
		font-size: 8rem;
		font-weight: 100;
		margin-bottom: 0.5rem;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
	}

	.date {
		font-size: 2rem;
		font-weight: 300;
		margin-bottom: 1rem;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
	}
</style>
