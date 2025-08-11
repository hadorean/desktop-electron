import { Server as SocketIOServer, Socket } from 'socket.io'
import { createServer } from 'http'
import { settingsService } from '../services/settings'
import { getDebugMenuVisible } from '@heyketsu/shared/stores/debugStore'
import { SocketEvents, ServerEvents, ClientEvents, ServerEventMap, ClientEventMap } from '@heyketsu/shared/types/sockets'

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

  /**
   * Type-safe wrapper for handling client-to-server events
   */
  private onClientEvent<T extends ClientEvents>(socket: Socket, event: T, handler: (data: ClientEventMap[T]) => void | Promise<void>): void {
    socket.on(event, handler)
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', async (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`)

      // Send current settings to newly connected client
      try {
        const settings = await settingsService.getSettings()
        socket.emit(SocketEvents.SettingsUpdate, {
          type: 'settings_update',
          settings,
          timestamp: Date.now(),
          clientId: 'server'
        })
      } catch (error) {
        console.error('Error sending settings to new client:', error)
      }

      // Send current debug state to newly connected client
      try {
        socket.emit(SocketEvents.DebugStateChanged, {
          visible: getDebugMenuVisible(),
          timestamp: Date.now()
        })
      } catch (error) {
        console.error('Error sending debug state to new client:', error)
      }

      // Handle settings updates from clients - type-safe
      this.onClientEvent(socket, SocketEvents.ClientUpdatedSettings, async (data) => {
        try {
          const { settings, clientId } = data
          const updateEvent = await settingsService.updateSettings(settings, clientId)

          // Broadcast to all other clients
          socket.broadcast.emit(SocketEvents.SettingsUpdate, updateEvent)
        } catch (error) {
          console.error('Error handling socket settings update:', error)
        }
      })

      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`)
      })
    })
  }

  /**
   * Broadcast an event to all connected clients
   */
  public emit<T extends ServerEvents>(event: T, data: ServerEventMap[T]): void {
    this.io.emit(event, data)
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
