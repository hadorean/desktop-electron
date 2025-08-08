// Main exports for @heyketsu/shared package
export * from './types';
export * from './utils';
export * from './constants';

// Legacy adapters (IPC/HTTP) - will be phased out
export {
	BaseSettingsAdapter,
	HttpSettingsAdapter,
	IpcSettingsAdapter,
	createIpcAdapterIfAvailable,
	type HttpAdapterConfig,
	type SettingsAdapterEvent
} from './adapters';

// UI Components
export * from './components';

// Services (API, Socket.IO)
export * from './services';

// Stores and Store Adapters
export * from './stores';
