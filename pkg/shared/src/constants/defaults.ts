// Default settings constants
import type {
  UISettings,
  ServerSettings,
} from "../types/settings.js";

export const DEFAULT_UI_SETTINGS: UISettings = {
  selectedImage: "",
  opacity: 1,
  blur: 0,
  saturation: 1,
  hideButton: false,
  transitionTime: 1,
  showTimeDate: true,
  showWeather: false,
  showScreenSwitcher: true,
  favorites: [],
  settingsButtonPosition: "bottom-right",
};

export const DEFAULT_SERVER_SETTINGS: ServerSettings = {
  shared: DEFAULT_UI_SETTINGS,
  screens: {},
};
