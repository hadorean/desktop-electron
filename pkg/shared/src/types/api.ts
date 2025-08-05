// API type definitions
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface SettingsUpdateRequest {
  screenId?: string;
  settings: Partial<import('./settings.js').ScreenSettings>;
}

export interface ImageUploadRequest {
  screenId: string;
  file: File | Buffer;
  filename: string;
}

export interface ThumbnailRequest {
  url: string;
  width?: number;
  height?: number;
}