// Types for weather data
export interface WeatherData {
	current: {
		temperature: number
		condition: string
		icon: string
	}
	forecast: {
		temperature: number
		condition: string
	}
}
