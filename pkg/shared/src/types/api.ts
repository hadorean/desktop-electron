export const ApiRoutes = {
	// Health & Info
	Health: '/health',
	Info: '/api/info',

	// Images
	Images: '/api/images',
	Image: '/api/image',
	Thumbnail: '/api/thumbnail',

	// Thumbnails
	ThumbnailsStatus: '/api/thumbnails/status',
	ThumbnailsClearCache: '/api/thumbnails/clear-cache',

	// Settings
	Settings: '/api/settings',
	UpdateSettings: '/api/update-settings',

	// Background & App Routes
	Background: '/background',
	App: '/app',
	AppStatic: '/app-static',
	AppDynamic: '/app/:screenId',

	// Development Routes
	DevInfo: '/dev/info',
	DevClearCache: '/dev/clear-cache',
	DevClientRebuilt: '/dev/client-rebuilt',

	// Weather (used in api service)
	Weather: '/api/weather',
	WeatherForecast: '/weatherforecast'
} as const

// Type for API routes
export type ApiRoute = (typeof ApiRoutes)[keyof typeof ApiRoutes]

// Type for routes that accept GET requests
export type GetRoutes =
	| typeof ApiRoutes.Health
	| typeof ApiRoutes.Info
	| typeof ApiRoutes.Images
	| typeof ApiRoutes.Image
	| typeof ApiRoutes.Thumbnail
	| typeof ApiRoutes.ThumbnailsStatus
	| typeof ApiRoutes.Settings
	| typeof ApiRoutes.Background
	| typeof ApiRoutes.App
	| typeof ApiRoutes.AppStatic
	| typeof ApiRoutes.AppDynamic
	| typeof ApiRoutes.DevInfo
	| typeof ApiRoutes.Weather
	| typeof ApiRoutes.WeatherForecast

// Type for routes that accept POST requests
export type PostRoutes =
	| typeof ApiRoutes.ThumbnailsClearCache
	| typeof ApiRoutes.UpdateSettings
	| typeof ApiRoutes.DevClearCache
	| typeof ApiRoutes.DevClientRebuilt

// Helper functions for building dynamic routes
export const buildRoute = {
	background: (monitorId: number | string) => `/background/${monitorId}`,
	app: (screenId: string) => `/app/${screenId}`,
	image: (name: string) => `/api/image?name=${encodeURIComponent(name)}`,
	thumbnail: (name: string) => `/api/thumbnail?name=${encodeURIComponent(name)}`,
	weather: (location: string) => `/api/weather/${encodeURIComponent(location)}`
}

// Type-safe route helpers for Express server methods
export type ExpressGetRoute = GetRoutes
export type ExpressPostRoute = PostRoutes
