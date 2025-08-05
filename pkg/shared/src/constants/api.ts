// API constants
export const API_ENDPOINTS = {
  SETTINGS: '/api/settings',
  UPLOAD: '/api/upload',
  THUMBNAIL: '/api/thumbnail',
  HEALTH: '/api/health'
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
} as const;

export const MIME_TYPES = {
  JSON: 'application/json',
  PNG: 'image/png',
  JPEG: 'image/jpeg',
  WEBP: 'image/webp'
} as const;