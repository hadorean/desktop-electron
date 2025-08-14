// Compile-time configuration for the Electron app
export interface AppConfig {
	window: {
		transparent: boolean
	}
}

// Default configuration
export const appConfig: AppConfig = {
	window: {
		transparent: true
	}
}
