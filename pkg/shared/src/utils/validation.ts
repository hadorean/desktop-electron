// Validation utility functions
import type { ScreenSettings, GlobalSettings } from '../types/settings.js';

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidScreenSettings(settings: Partial<ScreenSettings>): boolean {
  if (settings.imageUrl && !isValidUrl(settings.imageUrl)) {
    return false;
  }
  
  if (settings.webUrl && !isValidUrl(settings.webUrl)) {
    return false;
  }
  
  if (settings.blur !== undefined && (settings.blur < 0 || settings.blur > 100)) {
    return false;
  }
  
  if (settings.brightness !== undefined && (settings.brightness < 0 || settings.brightness > 200)) {
    return false;
  }
  
  if (settings.contrast !== undefined && (settings.contrast < 0 || settings.contrast > 200)) {
    return false;
  }
  
  if (settings.opacity !== undefined && (settings.opacity < 0 || settings.opacity > 100)) {
    return false;
  }
  
  return true;
}

export function validateGlobalSettings(settings: Partial<GlobalSettings>): string[] {
  const errors: string[] = [];
  
  if (settings.screens) {
    settings.screens.forEach((screen, index) => {
      if (!isValidScreenSettings(screen)) {
        errors.push(`Invalid settings for screen at index ${index}`);
      }
    });
  }
  
  if (settings.theme && !['light', 'dark', 'auto'].includes(settings.theme)) {
    errors.push('Invalid theme value');
  }
  
  return errors;
}