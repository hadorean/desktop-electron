/**
 * HTTP-based settings adapter for client applications
 * Uses API endpoints to communicate with the server
 */

import type { UISettings, ServerSettings } from '../types/settings';
import { BaseSettingsAdapter } from './settings-communication';

export interface HttpAdapterConfig {
	baseUrl?: string;
	clientId?: string;
}

/**
 * HTTP API response formats
 */
interface SettingsApiResponse {
	settings: ServerSettings;
	message: string;
}

interface UpdateSettingsResponse {
	message: string;
	settings: ServerSettings;
	timestamp: number;
}

export class HttpSettingsAdapter extends BaseSettingsAdapter {
	private baseUrl: string;
	private clientId: string;
	//private eventSource: EventSource | null = null

	constructor(config: HttpAdapterConfig = {}) {
		super();
		this.baseUrl = config.baseUrl || this.getDefaultBaseUrl();
		this.clientId = config.clientId || 'http-client';
	}

	private getDefaultBaseUrl(): string {
		// In browser, try to detect from window.location
		if (typeof window !== 'undefined' && window.location) {
			return `${window.location.protocol}//${window.location.host}`;
		}
		// Fallback for server-side rendering or Node.js
		return 'http://localhost:8080';
	}

	/**
	 * Make HTTP request with proper error handling
	 */
	private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
		const url = `${this.baseUrl}${endpoint}`;

		const defaultOptions: RequestInit = {
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json'
			}
		};

		const finalOptions = { ...defaultOptions, ...options };

		try {
			const response = await fetch(url, finalOptions);

			if (!response.ok) {
				const errorData = await response.json().catch(() => null);
				throw new Error(errorData?.message || `HTTP ${response.status}: ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			console.error(`HTTP Settings Adapter request failed (${url}):`, error);
			throw error;
		}
	}

	/**
	 * Update shared settings via API
	 */
	async updateSharedSettings(settings: Partial<UISettings>): Promise<void> {
		const currentSettings = await this.getSettings();
		const updatedServerSettings: Partial<ServerSettings> = {
			shared: {
				...currentSettings.shared,
				...settings
			}
		};

		await this.makeRequest<UpdateSettingsResponse>('/api/update-settings', {
			method: 'POST',
			body: JSON.stringify({
				settings: updatedServerSettings,
				clientId: this.clientId
			})
		});

		// Refresh and notify listeners
		const newSettings = await this.getSettings();
		this.notifyListeners(newSettings);
	}

	/**
	 * Update local settings for a specific screen via API
	 */
	async updateLocalSettings(screenId: string, settings: Partial<UISettings>): Promise<void> {
		const currentSettings = await this.getSettings();
		const updatedServerSettings: Partial<ServerSettings> = {
			screens: {
				...currentSettings.screens,
				[screenId]: {
					...currentSettings.screens[screenId],
					...settings
				}
			}
		};

		await this.makeRequest<UpdateSettingsResponse>('/api/update-settings', {
			method: 'POST',
			body: JSON.stringify({
				settings: updatedServerSettings,
				clientId: this.clientId
			})
		});

		// Refresh and notify listeners
		const newSettings = await this.getSettings();
		this.notifyListeners(newSettings);
	}

	/**
	 * Get all settings via API
	 */
	async getSettings(): Promise<ServerSettings> {
		const response = await this.makeRequest<SettingsApiResponse>('/api/settings');
		return response.settings;
	}

	/**
	 * Subscribe to settings changes via Server-Sent Events (if available) or WebSocket
	 * For now, we'll implement a basic polling fallback
	 */
	subscribeToChanges(callback: (settings: ServerSettings) => void): () => void {
		// Add to parent listeners
		const unsubscribe = super.subscribeToChanges(callback);

		// TODO: Implement WebSocket or SSE for real-time updates
		// For now, we rely on manual refresh after updates

		return unsubscribe;
	}

	/**
	 * Check if the HTTP API is available
	 */
	async isAvailable(): Promise<boolean> {
		try {
			await this.makeRequest<SettingsApiResponse>('/api/settings');
			return true;
		} catch (error) {
			console.warn('HTTP Settings API not available:', error);
			return false;
		}
	}

	/**
	 * Set the base URL for API calls
	 */
	setBaseUrl(baseUrl: string): void {
		this.baseUrl = baseUrl;
	}

	/**
	 * Set the client ID for identification
	 */
	setClientId(clientId: string): void {
		this.clientId = clientId;
	}
}
