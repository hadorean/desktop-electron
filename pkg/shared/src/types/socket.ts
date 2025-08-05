// Socket.io event type definitions
export interface ServerToClientEvents {
  'settings-updated': (data: import('./settings.js').GlobalSettings) => void;
  'screen-updated': (data: import('./settings.js').ScreenSettings) => void;
  'reload-backgrounds': () => void;
  'make-interactive': () => void;
  'make-non-interactive': () => void;
  'client-connected': (clientId: string) => void;
  'client-disconnected': (clientId: string) => void;
}

export interface ClientToServerEvents {
  'get-settings': (callback: (settings: import('./settings.js').GlobalSettings) => void) => void;
  'update-settings': (data: import('./api.js').SettingsUpdateRequest) => void;
  'upload-image': (data: import('./api.js').ImageUploadRequest) => void;
  'client-ready': (clientId: string) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  clientId: string;
  clientType: 'browser' | 'electron';
}