// User options type definitions

export interface UserOptions {
	imageDirectory: string
	port: number
	autoStart: boolean
	openWindowOnStart: boolean
	windowOpacity: number
}

export interface UserOptionsUpdateEvent {
	type: 'user_options_update'
	options: UserOptions
	timestamp: number
	clientId: string
}

export const DefaultUserOptions: UserOptions = {
	imageDirectory: 'D:\\pictures\\wall', // Default fallback
	port: 8080,
	autoStart: true,
	openWindowOnStart: false,
	windowOpacity: 1.0
}
