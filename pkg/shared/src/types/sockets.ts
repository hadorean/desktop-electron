export interface ImagesUpdatedEvent {
	timestamp: number
	reason: 'file_change' | 'manual_refresh' | 'startup'
	filename?: string
	eventType?: string
}

export interface SocketEvent<T> {
	data: T
	clientId?: string
}
