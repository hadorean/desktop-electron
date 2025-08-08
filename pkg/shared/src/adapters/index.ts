/**
 * Settings communication adapters
 */

export { BaseSettingsAdapter } from './settings-communication'
export type { SettingsAdapter, SettingsAdapterEvent } from './settings-communication'
export { HttpSettingsAdapter } from './http-settings-adapter'
export type { HttpAdapterConfig } from './http-settings-adapter'
export { IpcSettingsAdapter, createIpcAdapterIfAvailable } from './ipc-settings-adapter'