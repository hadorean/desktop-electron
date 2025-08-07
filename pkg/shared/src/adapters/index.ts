/**
 * Settings communication adapters
 */

export { BaseSettingsAdapter } from './settings-communication.js'
export type { SettingsAdapter, SettingsAdapterEvent } from './settings-communication.js'
export { HttpSettingsAdapter } from './http-settings-adapter.js'
export type { HttpAdapterConfig } from './http-settings-adapter.js'
export { IpcSettingsAdapter, createIpcAdapterIfAvailable } from './ipc-settings-adapter.js'