// Default settings constants
import type { ScreenSettings, GlobalSettings, ApiSettings } from '../types/settings.js';

export const DEFAULT_SCREEN_SETTINGS: ScreenSettings = {
  id: '',
  name: 'New Screen',
  blur: 0,
  brightness: 100,
  contrast: 100,
  opacity: 100,
  interactive: false,
  visible: true
};

export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  screens: [],
  currentScreenId: '',
  theme: 'auto',
  autoStart: false,
  hotkeys: {
    toggleVisible: 'Ctrl+Alt+H',
    nextScreen: 'Ctrl+Alt+Right',
    previousScreen: 'Ctrl+Alt+Left'
  }
};

export const DEFAULT_API_SETTINGS: ApiSettings = {
  timeZone: 'UTC',
  units: 'metric'
};

export const SERVER_DEFAULTS = {
  PORT: 3000,
  CLIENT_PORT: 5173,
  SOCKET_PATH: '/socket.io'
} as const;