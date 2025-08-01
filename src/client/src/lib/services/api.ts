/**
 * API client for making requests to the server
 */
import { get } from 'svelte/store';
import { effectiveApiUrl } from '../stores/apiStore';

/**
 * Creates API request options with proper headers
 */
function createRequestOptions(method: string, body?: any): RequestInit {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
    // Credentials can cause CORS issues with AllowAnyOrigin
    // credentials: 'include'
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  return options;
}

/**
 * Fetch wrapper with error handling
 */
async function fetchWithErrorHandling<T>(url: string, options: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `API request failed with status ${response.status}`);
    }
    
    return response.json() as Promise<T>;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * Get base URL from store
 */
function getBaseUrl(): string {
  return get(effectiveApiUrl) || '';
}

/**
 * Build a complete URL from the base URL and endpoint
 */
function buildUrl(endpoint: string): string {
  // Get the base URL from store
  const baseUrl = getBaseUrl();
  
  // If we have a configured base URL, use it
  if (baseUrl) {
    // Handle both with and without trailing slashes in baseUrl
    const separator = baseUrl.endsWith('/') ? '' : '/';
    const path = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    return `${baseUrl}${separator}${path}`;
  }
  
  // In production with no configured base URL, use relative URLs
  // This ensures the API is called relative to the current host
  return `/${endpoint.startsWith('/') ? endpoint.substring(1) : endpoint}`;
}

// Types for image data
export interface ImageInfo {
  name: string;
  thumbnailUrl: string;
  fullUrl: string;
}

/**
 * Get the URL for an image from the server
 */
export function getImageUrl(imageName: string, useThumbnail: boolean = false): string {
  if (!imageName) return '';
  
  // Get the base URL from store
  const baseUrl = getBaseUrl();
  
  // If we have a configured base URL, use it
  if (baseUrl) {
    // Handle both with and without trailing slashes
    const separator = baseUrl.endsWith('/') ? '' : '/';
    const path = useThumbnail ? 'thumbnails' : 'images';
    return `${baseUrl}${separator}${path}/${imageName}`;
  }
  
  // In production with no configured base URL, use relative URLs
  const path = useThumbnail ? 'thumbnails' : 'images';
  return `/${path}/${imageName}`;
}

// Types for weather data
export interface WeatherData {
  current: {
    temperature: number;
    condition: string;
    icon: string;
  };
  forecast: {
    temperature: number;
    condition: string;
  };
}

/**
 * API client methods
 */
export const api = {
  /**
   * Get list of available images with thumbnails
   */
  getImages: async (): Promise<ImageInfo[]> => {
    const url = buildUrl('api/images');
    return fetchWithErrorHandling<ImageInfo[]>(url, createRequestOptions('GET'));
  },

  /**
   * Get weather forecast (example)
   */
  getWeatherForecast: async () => {
    const url = buildUrl('weatherforecast');
    return fetchWithErrorHandling(url, createRequestOptions('GET'));
  },

  /**
   * Custom API call
   */
  call: async <T>(endpoint: string, method = 'GET', body?: any): Promise<T> => {
    const url = buildUrl(endpoint);
    return fetchWithErrorHandling<T>(url, createRequestOptions(method, body));
  },

  /**
   * Get weather conditions
   */
  getWeather: async (location: string = 'auto:ip'): Promise<WeatherData | null> => {
    try {
      
      // Use browser's location API if 'auto:ip'
      if (location === 'auto:ip' && navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          
          location = `${position.coords.latitude},${position.coords.longitude}`;
        } catch (locError) {
          console.warn('Unable to get location, using IP-based location');
        }
      }
      
      
      const url = buildUrl(`api/weather/${location}`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        current: {
          temperature: Math.round(data.current.temp_c),
          condition: data.current.condition.text,
          icon: data.current.condition.icon
        },
        forecast: {
          temperature: Math.round(data.forecast.forecastday[1].day.maxtemp_c),
          condition: data.forecast.forecastday[1].day.condition.text
        }
      };
    } catch (error) {
      console.error('Error fetching weather:', error);
      return null;
    }
  }
}; 