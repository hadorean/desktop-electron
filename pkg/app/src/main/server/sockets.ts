import { debugMenu } from '$shared/stores/debugStore'
import { DefaultTransitionSettings, RenderSettings } from '$shared/types/settings'
import { type SocketEvent } from '$shared/types/sockets'
import { createServer } from 'http'
import { Socket, Server as SocketIOServer } from 'socket.io'
import { settingsService } from '../services/settings'

type AsyncHandler<T> = (data: T) => Promise<T>
type Handler<T> = ((data: T) => T) | AsyncHandler<T> | null

export class SocketManager {
	private io: SocketIOServer

	constructor(httpServer: ReturnType<typeof createServer>) {
		this.io = new SocketIOServer(httpServer, {
			cors: {
				origin: '*',
				methods: ['GET', 'POST']
			}
		})
		this.setupSocketHandlers()
	}

	private setupSocketHandlers(): void {
		this.io.on('connection', async socket => {
			console.log(`🔌 Client connected: ${socket.id}`)

			// Send current settings to newly connected client
			try {
				const settings = await settingsService.getSettings()
				this.emit('settings_update', { settings, transition: DefaultTransitionSettings })
			} catch (error) {
				console.error('Error sending settings to new client:', error)
			}

			// Send current debug state to newly connected client
			try {
				this.emit('debug_state_changed', { visible: debugMenu.getVisible() })
			} catch (error) {
				console.error('Error sending debug state to new client:', error)
			}

			// // Handle settings updates from clients - type-safe
			// socket.on(SocketEvents.ClientUpdatedSettings, async data => {
			// 	try {
			// 		const { settings, clientId } = data
			// 		const updateEvent = await settingsService.updateSettings(settings, clientId)

			// 		// Broadcast to all other clients
			// 		socket.broadcast.emit(SocketEvents.SettingsUpdate, updateEvent)
			// 	} catch (error) {
			// 		console.error('Error handling socket settings update:', error)
			// 	}
			// })

			this.relay<RenderSettings>(socket, 'settings_update', async event => {
				const { data } = event
				const updated = await settingsService.updateSettings(data.settings)
				const result = { settings: updated, transition: data.transition } as RenderSettings
				return { data: result, clientId: 'server' }
			})

			//this.relay<TransitionSettings>(socket, 'transition_changed')

			socket.on('disconnect', () => {
				console.log(`🔌 Client disconnected: ${socket.id}`)
			})
		})
	}

	/**
	 * Relay an event to all connected clients
	 * @param socket - The socket to relay the event to
	 * @param event - The event to relay
	 * @param handler - optional: The handler to use to process the event locally and return an updated event data
	 */
	private relay<T>(socket: Socket, event: string, handler: Handler<SocketEvent<T>> = null): void {
		socket.on(event, async (data: SocketEvent<T>) => {
			try {
				let updatedData = data
				if (handler) {
					const result = handler(data)
					if (result instanceof Promise) {
						updatedData = await result
					}
				}
				//console.log(`🔌 Broadcasting ${event}:`, updatedData)
				socket.broadcast.emit(event, updatedData)
			} catch (error) {
				console.error(`Error handling socket ${event}:`, error)
			}
		})
	}

	/**
	 * Broadcast an event to all connected clients
	 */
	public emit<T>(event: string, data: T): void {
		this.io.emit(event, { data, clientId: 'server' } as SocketEvent<T>)
	}

	/**
	 * Broadcast images updated event to all clients
	 */
	public broadcastImagesUpdated(
		reason: 'file_change' | 'manual_refresh' | 'startup',
		filename?: string,
		eventType?: string
	): void {
		//console.log(`🔌 Broadcasting images updated: ${reason} ${filename ? `(${filename})` : ''}`)
		this.emit('images_updated', {
			timestamp: Date.now(),
			reason,
			filename,
			eventType
		})
	}

	/**
	 * Get the number of connected clients
	 */
	public getConnectedClientsCount(): number {
		return this.io.sockets.sockets.size
	}

	/**
	 * Close the Socket.IO server
	 */
	public close(): void {
		this.io.close()
		console.log('🔌 Socket.IO server closed')
	}
}
