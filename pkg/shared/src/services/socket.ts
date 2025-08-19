import { io, Socket } from 'socket.io-client'
import { apiStore } from '../stores/apiStore'
import { settingsStore } from '../stores/settingsStore'
import type { ImagesUpdatedEvent, SettingsUpdateEvent } from '../types'
import { ClientEvents, SocketEvents } from '../types'
import { Signal, type ISignal } from '../utils/signal'

// interface SettingsUpdatedResponse {
// 	success: boolean
// 	settings?: unknown
// 	timestamp?: number
// 	error?: string
// }

export class SocketService {
	private socket: Socket | null = null
	private isConnected = false
	private reconnectAttempts = 0
	private maxReconnectAttempts = 5
	private reconnectDelay = 1000

	private updatingSettingsFromServer = false
	private initialSubscribeHandled = false
	private subbscribedToLocalSettings = false

	private _settingsUpdated: Signal<SettingsUpdateEvent> = new Signal()
	public get settingsUpdated(): ISignal<SettingsUpdateEvent> {
		return this._settingsUpdated
	}

	private _connectionStatus: Signal<boolean> = new Signal()
	public get connectionStatus(): ISignal<boolean> {
		return this._connectionStatus
	}

	private _debugStateChanged: Signal<boolean> = new Signal()
	public get debugStateChanged(): ISignal<boolean> {
		return this._debugStateChanged
	}

	private _imagesUpdated: Signal<ImagesUpdatedEvent> = new Signal()
	public get imagesUpdated(): ISignal<ImagesUpdatedEvent> {
		return this._imagesUpdated
	}

	constructor() {
		this.delayedInitialize()
	}

	private delayedInitialize(): void {
		// Wait a bit for server data injection to happen
		setTimeout(() => {
			apiStore.url.subscribe(url => {
				if (typeof window !== 'undefined' && url) {
					console.log('🔌 API URL changed, reinitializing socket:', url)
					socketService.reinitialize()
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
	}

	private setupEventHandlers(): void {
		if (!this.socket) return

		// Handling standard events: 'connect' | 'disconnect' | 'connect_error'

		this.socket.on('connect', () => {
			console.log('🔌 Socket.IO connected:', this.socket?.id)
			this.isConnected = true
			this.reconnectAttempts = 0
			this._connectionStatus.emit(true)
		})

		this.socket.on('disconnect', reason => {
			console.log('🔌 Socket.IO disconnected:', reason)
			this.isConnected = false
			this._connectionStatus.emit(false)
		})

		this.socket.on('connect_error', error => {
			console.error('🔌 Socket.IO connection error:', error)
			this.isConnected = false
			this.reconnectAttempts++

			if (this.reconnectAttempts >= this.maxReconnectAttempts) {
				console.error('🔌 Max reconnection attempts reached')
			}

			this._connectionStatus.emit(false)
		})

		// Handle settings updates from server
		this.socket.on(SocketEvents.SettingsUpdate, (event: SettingsUpdateEvent) => {
			const clientId = socketService.getSocketId()
			if (event.clientId == clientId) return

			this.updatingSettingsFromServer = true
			settingsStore.updateSettings(event.settings)
			this.updatingSettingsFromServer = false

			//console.log('🔌 Received settings update:', event)
			this._settingsUpdated.emit(event)
		})

		// Handle debug state change events
		this.socket.on(SocketEvents.DebugStateChanged, (data: { visible: boolean }) => {
			//console.log('🔌 Received debug state change event:', data.visible)
			this._debugStateChanged.emit(data.visible)
		})

		// Handle images updated events
		this.socket.on(SocketEvents.ImagesUpdated, (data: ImagesUpdatedEvent) => {
			//console.log('🔌 Received images updated event:', data)
			this._imagesUpdated.emit(data)
		})

		if (this.subbscribedToLocalSettings) return
		this.subbscribedToLocalSettings = true

		settingsStore.userSettings.subscribe(userSettings => {
			if (!this.initialSubscribeHandled) {
				this.initialSubscribeHandled = true
				return // Skip the initial subscribe callback
			}

			// Check if server sync should be prevented (e.g., during validation operations)
			// if (settingsStore.shouldPreventServerSync()) {
			// 	console.log('🚫 Skipping server sync (silent update)')
			// 	return
			// }

			if (!this.updatingSettingsFromServer && this.getConnectionStatus()) {
				//console.log('Updating settings from client:', value)
				// Use socket ID as client ID
				const clientId = this.getSocketId()
				this.updateSettings(userSettings, clientId)
			}
		})
	}

	/**
	 * Reinitialize connection (useful when stores are updated)
	 */
	public reinitialize(): void {
		if (this.socket) {
			this.socket.disconnect()
		}

		setTimeout(() => {
			this.initializeConnection()
		}, 100)
	}

	/**
	 * Type-safe emit for client-to-server events
	 */
	private emitToServer(event: ClientEvents, data: unknown): void {
		if (!this.isConnected || !this.socket) {
			console.warn('🔌 Cannot send event - not connected')
			return
		}
		this.socket.emit(event, data)
	}

	/**
	 * Send settings update to server
	 */
	public updateSettings(settings: unknown, clientId?: string): void {
		if (!this.isConnected || !this.socket) {
			console.warn('🔌 Cannot send settings update - not connected')
			return
		}

		//console.log('🔌 Sending settings update to server:', settings)

		this.emitToServer(SocketEvents.ClientUpdatedSettings, {
			settings,
			clientId: clientId || this.socket.id
		})
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
}

// Create singleton instance
export const socketService = new SocketService()
