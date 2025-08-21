import { io, Socket } from 'socket.io-client'
import { apiStore } from '../stores/apiStore'
import { settingsStore } from '../stores/settingsStore'
import type { ImagesUpdatedEvent, RenderSettings, SocketEvent } from '../types'
import { Flag } from '../utils/flag'
import { Scope } from '../utils/scope'
import { Signal, type ISignal } from '../utils/signal'

export class SocketService {
	private socket: Socket | null = null
	private isConnected = false
	private reconnectAttempts = 0
	private maxReconnectAttempts = 5
	private reconnectDelay = 1000

	private updatingSettingsFromServer = false
	private initialSubscribeHandled = new Flag()
	private subbscribedToLocalSettings = false

	private settingsUpdated: Signal<RenderSettings> = new Signal()
	private connectionStatus: Signal<boolean> = new Signal()
	private debugStateChanged: Signal<boolean> = new Signal()
	private imagesUpdated: Signal<ImagesUpdatedEvent> = new Signal()

	public on = {
		settingsUpdated: this.settingsUpdated as ISignal<RenderSettings>,
		connectionStatus: this.connectionStatus as ISignal<boolean>,
		debugStateChanged: this.debugStateChanged as ISignal<boolean>,
		imagesUpdated: this.imagesUpdated as ISignal<ImagesUpdatedEvent>
	}

	private scope: Scope = new Scope()

	constructor() {
		this.delayedInitialize()
	}

	private delayedInitialize(): void {
		// Wait a bit for server data injection to happen
		setTimeout(() => {
			apiStore.url.subscribe(url => {
				if (typeof window !== 'undefined' && url) {
					console.log('🔌 API URL changed, reinitializing socket:', url)
					this.reinitialize()
				}
			})
		}, 100)
	}

	private initializeConnection(): void {
		const serverUrl = apiStore.getUrl()
		console.log('🔌 Initializing Socket.IO connection to:', serverUrl)

		this.socket = io(serverUrl, {
			autoConnect: true,
			reconnection: true,
			reconnectionAttempts: this.maxReconnectAttempts,
			reconnectionDelay: this.reconnectDelay,
			transports: ['websocket', 'polling']
		})

		this.setupEventHandlers()
		this.subscribeToLocalSettings()
	}

	private setupEventHandlers(): void {
		if (!this.socket) return

		// Handling standard events: 'connect' | 'disconnect' | 'connect_error'

		this.socket.on('connect', () => {
			console.log('🔌 Socket.IO connected:', this.socket?.id)
			this.isConnected = true
			this.reconnectAttempts = 0
			this.connectionStatus.emit(true)
		})

		this.socket.on('disconnect', reason => {
			console.log('🔌 Socket.IO disconnected:', reason)
			this.isConnected = false
			this.connectionStatus.emit(false)
		})

		this.socket.on('connect_error', error => {
			console.error('🔌 Socket.IO connection error:', error)
			this.isConnected = false
			this.reconnectAttempts++

			if (this.reconnectAttempts >= this.maxReconnectAttempts) {
				console.error('🔌 Max reconnection attempts reached')
			}

			this.connectionStatus.emit(false)
		})

		// Handle settings updates from server
		this.listen('settings_update', (event: SocketEvent<RenderSettings>) => {
			const clientId = socketService.getSocketId()
			if (event.clientId == clientId || this.updatingSettingsFromServer) return

			this.updatingSettingsFromServer = true
			settingsStore.updateSettings(event.data.settings)
			settingsStore.setTransition(event.data.transition)
			this.updatingSettingsFromServer = false
		})

		// Handle debug state change events
		this.listen('debug_state_changed', (event: SocketEvent<{ visible: boolean }>) => {
			//console.log('🔌 Received debug state change event:', data.visible)
			this.debugStateChanged.emit(event.data.visible)
		})

		// Handle images updated events
		this.listen('images_updated', (event: SocketEvent<ImagesUpdatedEvent>) => {
			//console.log('🔌 Received images updated event:', data)
			this.imagesUpdated.emit(event.data)
		})
	}

	private subscribeToLocalSettings(): void {
		if (this.subbscribedToLocalSettings) return
		this.subbscribedToLocalSettings = true

		this.scope.subscribe(settingsStore.renderSettings, renderSettings => {
			if (this.initialSubscribeHandled.turn()) {
				return // Skip the initial subscribe callback
			}

			// Check if server sync should be prevented (e.g., during validation operations)
			// if (settingsStore.shouldPreventServerSync()) {
			// 	console.log('🚫 Skipping server sync (silent update)')
			// 	return
			// }

			if (!this.updatingSettingsFromServer && this.getConnectionStatus()) {
				//console.log('Updating settings from client:')
				// Use socket ID as client ID
				this.emit('settings_update', renderSettings)
			}
		})
	}

	private listen<T>(event: string, handler: (data: SocketEvent<T>) => void): void {
		this.socket?.on(event, data => {
			console.log('🔌 Received event:', event, data)
			handler(data)
		})
	}

	/**
	 * Reinitialize connection (useful when stores are updated)
	 */
	public reinitialize(): void {
		if (this.socket) {
			this.disconnect()
		}

		setTimeout(() => {
			this.initializeConnection()
		}, 100)
	}

	/**
	 * Type-safe emit for client-to-server events
	 */
	private emit<T>(event: string, data: T): void {
		if (!this.isConnected || !this.socket) {
			console.warn('🔌 Cannot send event - not connected')
			return
		}
		this.socket.emit(event, { data, clientId: this.getSocketId() } as SocketEvent<T>)
	}

	/**
	 * Get current connection status
	 */
	public getConnectionStatus(): boolean {
		return this.isConnected
	}

	/**
	 * Get socket ID
	 */
	public getSocketId(): string | undefined {
		return this.socket?.id
	}

	/**
	 * Manually reconnect
	 */
	public reconnect(): void {
		if (this.socket) {
			console.log('🔌 Manual reconnection attempt')
			this.socket.connect()
		}
	}

	/**
	 * Disconnect and cleanup
	 */
	public disconnect(): void {
		if (this.socket) {
			console.log('🔌 Disconnecting Socket.IO')
			this.socket.disconnect()
			this.socket = null
		}
		this.isConnected = false
	}

	cleanup(): void {
		this.scope.cleanup()
	}
}

// Create singleton instance
export const socketService = new SocketService()
