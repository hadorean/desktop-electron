/**
 * Shared services for API, Socket.IO, and localStorage management
 */

// API service
export { api, getImageUrl, type ImageInfo, type WeatherData } from './api'

// Socket.IO service
export { SocketService, socketService, type SettingsUpdatedResponse } from './socket'

// Image change handling service
export { initializeImageChangeHandling, cleanupImageChangeHandling, getLastProcessedEventTimestamp, resetProcessedEventTimestamp } from './imageChanges'

// localStorage service
export { localStorageService, LocalStorageService } from './localStorage'
