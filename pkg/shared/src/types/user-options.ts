// User options type definitions

export interface UserOptions {
	imageDirectory: string
}

export interface UserOptionsUpdateEvent {
	type: 'user_options_update'
	options: UserOptions
	timestamp: number
	clientId: string
}

export const DefaultUserOptions: UserOptions = {
	imageDirectory: 'D:\\pictures\\wall' // Default fallback
}
