// Settings type definitions
export interface ScreenSettings {
  id: string;
  name: string;
  imageUrl?: string;
  webUrl?: string;
  blur: number;
  brightness: number;
  contrast: number;
  opacity: number;
  interactive: boolean;
  visible: boolean;
}

export interface GlobalSettings {
  screens: ScreenSettings[];
  currentScreenId: string;
  theme: 'light' | 'dark' | 'auto';
  autoStart: boolean;
  hotkeys: {
    toggleVisible: string;
    nextScreen: string;
    previousScreen: string;
  };
}

export interface ApiSettings {
  weatherApiKey?: string;
  timeZone: string;
  units: 'metric' | 'imperial';
}