// Socket.io event name constants
export const SOCKET_EVENTS = {
  // Server to Client
  SETTINGS_UPDATED: 'settings-updated',
  SCREEN_UPDATED: 'screen-updated',
  RELOAD_BACKGROUNDS: 'reload-backgrounds',
  MAKE_INTERACTIVE: 'make-interactive',
  MAKE_NON_INTERACTIVE: 'make-non-interactive',
  CLIENT_CONNECTED: 'client-connected',
  CLIENT_DISCONNECTED: 'client-disconnected',
  
  // Client to Server
  GET_SETTINGS: 'get-settings',
  UPDATE_SETTINGS: 'update-settings',
  UPLOAD_IMAGE: 'upload-image',
  CLIENT_READY: 'client-ready',
  
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error'
} as const;