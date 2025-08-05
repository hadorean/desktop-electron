import { io, Socket } from 'socket.io-client';
import { get } from 'svelte/store';
import { apiBaseUrl, effectiveApiUrl } from '../stores/apiStore';
import type { SettingsUpdateEvent } from '@heyketsu/shared/types';
import { SOCKET_EVENTS } from '@heyketsu/shared/constants';

export interface SettingsUpdatedResponse {
  success: boolean;
  settings?: any;
  timestamp?: number;
  error?: string;
}

export class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Event handlers
  private onSettingsUpdateCallback: ((event: SettingsUpdateEvent) => void) | null = null;
  private onConnectionStatusCallback: ((connected: boolean) => void) | null = null;

  constructor() {
    // Don't initialize immediately - wait for stores to be ready
    this.delayedInitialize();
  }

  private delayedInitialize(): void {
    // Wait a bit for server data injection to happen
    setTimeout(() => {
      this.initializeConnection();
    }, 100);
  }

  private initializeConnection(): void {
    const serverUrl = get(effectiveApiUrl) || get(apiBaseUrl) || 'http://localhost:8080';
    
    console.log('🔌 Initializing Socket.IO connection to:', serverUrl);
    
    this.socket = io(serverUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log('🔌 Socket.IO connected:', this.socket?.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.onConnectionStatusCallback?.(true);
    });

    this.socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      console.log('🔌 Socket.IO disconnected:', reason);
      this.isConnected = false;
      this.onConnectionStatusCallback?.(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Socket.IO connection error:', error);
      this.isConnected = false;
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('🔌 Max reconnection attempts reached');
      }
      
      this.onConnectionStatusCallback?.(false);
    });

    // Handle settings updates from server
    this.socket.on(SOCKET_EVENTS.SETTINGS_UPDATE, (event: SettingsUpdateEvent) => {
      console.log('🔌 Received settings update:', event);
      this.onSettingsUpdateCallback?.(event);
    });

    // Handle settings update acknowledgments
    this.socket.on('settings_updated', (response: SettingsUpdatedResponse) => {
      if (response.success) {
        console.log('🔌 Settings update acknowledged by server');
      } else {
        console.error('🔌 Settings update failed:', response.error);
      }
    });
  }

  /**
   * Update server URL and reconnect
   */
  public updateServerUrl(newUrl: string): void {
    console.log('🔌 Updating server URL to:', newUrl);
    
    if (this.socket) {
      this.socket.disconnect();
    }
    
    // Update the base URL and reconnect
    setTimeout(() => {
      this.initializeConnection();
    }, 500);
  }

  /**
   * Reinitialize connection (useful when stores are updated)
   */
  public reinitialize(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
    
    setTimeout(() => {
      this.initializeConnection();
    }, 100);
  }

  /**
   * Send settings update to server
   */
  public updateSettings(settings: any, clientId?: string): void {
    if (!this.isConnected || !this.socket) {
      console.warn('🔌 Cannot send settings update - not connected');
      return;
    }

    console.log('🔌 Sending settings update to server:', settings);
    
    this.socket.emit('update_settings', {
      settings,
      clientId: clientId || this.socket.id
    });
  }

  /**
   * Set callback for settings updates from server
   */
  public onSettingsUpdate(callback: (event: SettingsUpdateEvent) => void): void {
    this.onSettingsUpdateCallback = callback;
  }

  /**
   * Set callback for connection status changes
   */
  public onConnectionStatus(callback: (connected: boolean) => void): void {
    this.onConnectionStatusCallback = callback;
  }

  /**
   * Get current connection status
   */
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Get socket ID
   */
  public getSocketId(): string | undefined {
    return this.socket?.id;
  }

  /**
   * Manually reconnect
   */
  public reconnect(): void {
    if (this.socket) {
      console.log('🔌 Manual reconnection attempt');
      this.socket.connect();
    }
  }

  /**
   * Disconnect and cleanup
   */
  public disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting Socket.IO');
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
  }
}

// Create singleton instance
export const socketService = new SocketService();