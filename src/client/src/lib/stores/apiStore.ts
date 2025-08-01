import { writable, get } from 'svelte/store';

// Create a store for the API configuration toggle
export const apiConfigEnabled = writable(false);

// Get the initial value from localStorage or environment variable
const getInitialApiUrl = () => {
  if (typeof window !== 'undefined') {
    const savedUrl = localStorage.getItem('apiBaseUrl');
    if (savedUrl) return savedUrl;
  }
  return import.meta.env.VITE_API_BASE_URL || '';
};

// Create a store for the API URL
export const apiBaseUrl = writable(getInitialApiUrl());

// Create a derived store for the effective API URL
export const effectiveApiUrl = writable(getInitialApiUrl());

// Subscribe to changes and save to localStorage
if (typeof window !== 'undefined') {
  apiBaseUrl.subscribe(value => {
    localStorage.setItem('apiBaseUrl', value);
  });
}

// Update effective URL when either store changes
apiConfigEnabled.subscribe(enabled => {
  if (enabled) {
    effectiveApiUrl.set(get(apiBaseUrl));
  } else {
    effectiveApiUrl.set(import.meta.env.VITE_API_BASE_URL || '');
  }
});

apiBaseUrl.subscribe(value => {
  if (get(apiConfigEnabled)) {
    effectiveApiUrl.set(value);
  }
}); 