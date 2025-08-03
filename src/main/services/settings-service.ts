import { promises as fs } from 'fs'
import { join } from 'path'
import { app } from 'electron'

export type SettingsButtonPosition = 'bottom-right' | 'top-right' | 'bottom-left' | 'top-left'

export interface Settings {
  selectedImage: string
  opacity: number
  blur: number
  saturation: number
  hideButton: boolean
  transitionTime: number
  showTimeDate: boolean
  showWeather: boolean
  showScreenSwitcher: boolean
  favorites: string[]
  settingsButtonPosition: SettingsButtonPosition
}

export interface ServerSettings {
  lastModified?: string // ISO 8601 timestamp
  shared: Settings
  screens: Record<string, Partial<Settings>>
}

export interface SettingsUpdateEvent {
  type: 'settings_update'
  settings: ServerSettings
  timestamp: number
  clientId: string
}

export class SettingsService {
  private settings: ServerSettings | null = null
  private settingsPath: string
  private defaultSettings: ServerSettings = {
    shared: {
      selectedImage: '',
      opacity: 1,
      blur: 0,
      saturation: 1,
      hideButton: false,
      transitionTime: 1,
      showTimeDate: true,
      showWeather: false,
      showScreenSwitcher: true,
      favorites: [],
      settingsButtonPosition: 'bottom-right'
    },
    screens: {}
  }

  constructor() {
    this.settingsPath = join(app.getPath('userData'), 'settings.json')
  }

  /**
   * Get current settings from memory, loading from file if not cached
   */
  async getSettings(): Promise<ServerSettings> {
    if (this.settings === null) {
      await this.loadFromFileSystem()
    }
    return this.settings || this.defaultSettings
  }

  /**
   * Update settings and persist to file system
   */
  async updateSettings(
    newSettings: Partial<ServerSettings>,
    clientId: string
  ): Promise<SettingsUpdateEvent> {
    const currentSettings = await this.getSettings()
    const updatedSettings = { ...currentSettings, ...newSettings }

    // Update memory
    this.settings = updatedSettings

    // Persist to file system
    await this.saveToFileSystem()

    return {
      type: 'settings_update',
      settings: updatedSettings,
      timestamp: Date.now(),
      clientId
    }
  }

  /**
   * Load settings from file system
   */
  private async loadFromFileSystem(): Promise<void> {
    try {
      const settingsData = await fs.readFile(this.settingsPath, 'utf-8')
      const parsedSettings = JSON.parse(settingsData)

      // Merge with defaults to ensure all required properties exist
      this.settings = { ...this.defaultSettings, ...parsedSettings }

      console.log('Settings loaded from file system:', this.settingsPath)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.log('Settings file not found, using defaults')
        this.settings = this.defaultSettings
        await this.saveToFileSystem()
      } else {
        console.error('Error loading settings:', error)
        this.settings = this.defaultSettings
      }
    }
  }

  /**
   * Save current settings to file system
   */
  private async saveToFileSystem(): Promise<void> {
    try {
      const settingsJson = JSON.stringify(this.settings, null, 2)
      await fs.writeFile(this.settingsPath, settingsJson, 'utf-8')
      console.log('Settings saved to file system:', this.settingsPath)
    } catch (error) {
      console.error('Error saving settings:', error)
      throw error
    }
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings(): Promise<ServerSettings> {
    this.settings = { ...this.defaultSettings }
    await this.saveToFileSystem()
    return this.settings
  }

  /**
   * Get settings file path for debugging
   */
  getSettingsPath(): string {
    return this.settingsPath
  }
}
