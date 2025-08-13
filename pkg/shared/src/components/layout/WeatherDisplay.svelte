<script lang="ts">
	import { onMount } from 'svelte'
	import { cubicOut } from 'svelte/easing'
	import { Tween } from 'svelte/motion'
	import { api, type WeatherData } from '../../services'

	let weather: WeatherData | null = null
	let currentTime: string = '' // Current time in HH:MM format
	let greeting: string = '' // Time-based greeting
	let opacity = new Tween(0, {
		duration: 3000,
		easing: cubicOut
	})

	// Function to fetch weather data
	async function fetchWeather(): Promise<void> {
		try {
			weather = await api.getWeather()
			if (weather) {
				opacity.set(1)
			}
		} catch (error: unknown) {
			console.error('Error fetching weather:', error)
			weather = null
		}
	}

	// Function to update the current time and greeting
	function updateTime(): void {
		const now = new Date()
		const hours = now.getHours().toString().padStart(2, '0')
		const minutes = now.getMinutes().toString().padStart(2, '0')
		currentTime = `${hours}:${minutes}`

		// Format the date
		// const options: Intl.DateTimeFormatOptions = {
		// 	weekday: 'long',
		// 	month: 'long',
		// 	day: 'numeric'
		// };

		// Update greeting based on time of day
		const hourNum = parseInt(hours)
		if (hourNum >= 5 && hourNum < 12) {
			greeting = 'Good Morning'
		} else if (hourNum >= 12 && hourNum < 18) {
			greeting = 'Good Afternoon'
		} else {
			greeting = 'Good Evening'
		}
	}

	onMount(() => {
		// Set up periodic weather updates
		const weatherInterval = setInterval(fetchWeather, 5 * 60 * 1000) // Update every 5 minutes
		const timeInterval = setInterval(updateTime, 1000)

		fetchWeather()
		updateTime()

		return () => {
			clearInterval(weatherInterval)
			clearInterval(timeInterval)
		}
	})
</script>

{#if weather}
	<div class="weather-display" style="opacity: {opacity.current};">
		<div class="greeting">
			{greeting}
		</div>
		<div class="weather-info">
			It is currently {weather.current.temperature}°
			<br />with a high of {weather.forecast.temperature}° today.
			<br />{weather.current.condition}.
		</div>
		<div class="weather-temp">
			<span class="weather-icon">
				{#if weather.current.condition.toLowerCase().includes('sunny') || weather.current.condition.toLowerCase().includes('clear')}
					{#if parseInt(currentTime.split(':')[0]) >= 18 || parseInt(currentTime.split(':')[0]) < 6}
						🌙
					{:else}
						☀️
					{/if}
				{:else if weather.current.condition.toLowerCase().includes('cloud')}
					☁️
				{:else if weather.current.condition.toLowerCase().includes('rain') || weather.current.condition.toLowerCase().includes('shower')}
					🌧️
				{:else if weather.current.condition.toLowerCase().includes('snow')}
					❄️
				{:else if weather.current.condition.toLowerCase().includes('storm') || weather.current.condition.toLowerCase().includes('thunder')}
					⛈️
				{:else if weather.current.condition.toLowerCase().includes('fog') || weather.current.condition.toLowerCase().includes('mist')}
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
	.weather-display {
		pointer-events: none;
		position: fixed;
		left: 0;
		right: 0;
		top: 50%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: var(--text-primary);
		opacity: 0.8;
	}

	.greeting {
		margin-bottom: 0.5rem;
		text-align: center;
		font-size: 4rem;
		font-weight: 300;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
	}

	.weather-info {
		margin-bottom: 1rem;
		text-align: center;
		font-size: 2rem;
		font-weight: 300;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
	}

	.weather-temp {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 4rem;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
	}

	.weather-icon {
		margin-right: 0.5rem;
	}
</style>
