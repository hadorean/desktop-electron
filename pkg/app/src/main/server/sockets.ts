import { Server as SocketIOServer } from 'socket.io'
import { createServer } from 'http'
import { settingsService } from '../services/settings'
import { getDebugMenuVisible } from '@heyketsu/shared/stores/debugStore'

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
    this.io.on('connection', async (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`)

      // Send current settings to newly connected client
      try {
        const settings = await settingsService.getSettings()
        socket.emit('settings_update', {
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
        socket.emit('debug_state_changed', {
          visible: getDebugMenuVisible(),
          timestamp: Date.now()
        })
      } catch (error) {
        console.error('Error sending debug state to new client:', error)
      }

      // Handle settings updates from clients
      socket.on('update_settings', async (data) => {
        try {
          const { settings, clientId } = data
          const updateEvent = await settingsService.updateSettings(settings, clientId)

          // Broadcast to all other clients
          socket.broadcast.emit('settings_update', updateEvent)

          // Acknowledge to sender
          socket.emit('settings_updated', {
            success: true,
            settings: updateEvent.settings,
            timestamp: updateEvent.timestamp
          })
        } catch (error) {
          console.error('Error handling socket settings update:', error)
          socket.emit('settings_updated', {
            success: false,
            error: 'Failed to update settings'
          })
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
  public emit(event: string, data: any): void {
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
