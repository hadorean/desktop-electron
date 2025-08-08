<script lang="ts">
	import { onMount } from 'svelte';
	import { api, type WeatherData } from '$shared/services/api';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	let weather: WeatherData | null = null;
	let currentTime: string = ''; // Current time in HH:MM format
	let greeting: string = ''; // Time-based greeting
	let opacity = new Tween(0, {
		duration: 3000,
		easing: cubicOut
	});

	// Function to fetch weather data
	async function fetchWeather() {
		try {
			weather = await api.getWeather();
			if (weather) {
				opacity.set(1);
			}
		} catch (error: unknown) {
			console.error('Error fetching weather:', error);
			weather = null;
		}
	}

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

		// Update greeting based on time of day
		const hourNum = parseInt(hours);
		if (hourNum >= 5 && hourNum < 12) {
			greeting = 'Good Morning';
		} else if (hourNum >= 12 && hourNum < 18) {
			greeting = 'Good Afternoon';
		} else {
			greeting = 'Good Evening';
		}
	}

	onMount(() => {
		// Set up periodic weather updates
		const weatherInterval = setInterval(fetchWeather, 5 * 60 * 1000); // Update every 5 minutes
		const timeInterval = setInterval(updateTime, 1000);

		fetchWeather();
		updateTime();

		return () => {
			clearInterval(weatherInterval);
			clearInterval(timeInterval);
		};
	});
</script>

{#if weather}
	<div
		class="pointer-events-none fixed inset-x-0 top-1/2 flex flex-col items-center justify-center"
		style="opacity: {opacity.current};"
	>
		<div class="text-shadow-lg mb-2 text-center text-4xl font-light text-white opacity-80">
			{greeting}
		</div>
		<div class="text-shadow-lg mb-4 text-center text-2xl font-light text-white opacity-80">
			It is currently {weather.current.temperature}°
			<br />with a high of {weather.forecast.temperature}° today.
			<br />{weather.current.condition}.
		</div>
		<div class="text-shadow-lg flex items-center justify-center text-4xl text-white opacity-80">
			<span class="mr-2">
				{#if weather.current.condition.toLowerCase().includes('sunny') || weather.current.condition
						.toLowerCase()
						.includes('clear')}
					{#if parseInt(currentTime.split(':')[0]) >= 18 || parseInt(currentTime.split(':')[0]) < 6}
						🌙
					{:else}
						☀️
					{/if}
				{:else if weather.current.condition.toLowerCase().includes('cloud')}
					☁️
				{:else if weather.current.condition
					.toLowerCase()
					.includes('rain') || weather.current.condition.toLowerCase().includes('shower')}
					🌧️
				{:else if weather.current.condition.toLowerCase().includes('snow')}
					❄️
				{:else if weather.current.condition
					.toLowerCase()
					.includes('storm') || weather.current.condition.toLowerCase().includes('thunder')}
					⛈️
				{:else if weather.current.condition
					.toLowerCase()
					.includes('fog') || weather.current.condition.toLowerCase().includes('mist')}
					🌫️
				{:else}
					🌙
				{/if}
			</span>
			<span>{weather.current.temperature}°</span>
		</div>
	</div>
{/if}

<style>
</style>
