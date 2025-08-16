# Settings Storage Simplification

Date: 2025-08-16

## Goal
Simplify settings localStorage to use only one data structure (`settings`) for all settings, initializing the store based on this complete settings structure.

## Current State Analysis
- **Complex dual storage**: `settings.complete` (new) + `settings.shared`/`settings.local` (legacy)
- **Split initialization**: `loadInitialState()` handles some state, `loadSettings()` handles settings
- **Redundant storage**: Same data stored in multiple localStorage keys
- **Legacy migration**: Complex fallback logic for old storage format

## Proposed Changes

### 1. Consolidate Storage Keys
- **Rename**: `settings.complete` → `settings` (single source of truth)
- **Keep legacy keys temporarily** for migration, then remove them after successful load
- **Keep**: `debug.visible`, `apiUrl`, `currentScreen` (these are separate concerns)

### 2. Simplify Loading Logic
- **Merge** `loadInitialState()` and `loadSettings()` responsibilities into single flow
- **Single method**: `loadCompleteSettings()` that handles all settings loading
- **Keep migration logic** for backward compatibility with legacy `settings.shared`/`settings.local`
- **Streamline** initialization flow in App.svelte

### 3. Update Storage Subscriptions  
- **Change** settings storage key from `settings.complete` to `settings`
- **Remove** legacy localStorage writes (`settings.shared`, `settings.local`) after migration
- **Maintain** other subscriptions (debug, API URL, current screen)

### 4. Maintain Migration Support
- **Keep** `cleanupLegacyColorTypeData()` method for data cleanup
- **Keep** legacy fallback logic for users with old storage format
- **Add** cleanup of old keys after successful migration
- **Simplify** validation methods to work with unified structure

## Files to Modify
1. **pkg/shared/src/services/localStorage.ts**: Main refactoring
2. **pkg/client/src/App.svelte**: Update initialization to call single method
3. **pkg/shared/src/stores/settingsStore.ts**: No changes needed

## Implementation Steps
1. Create new `loadCompleteSettings()` method that handles all settings loading
2. Update store subscription to save to `settings` key instead of `settings.complete`
3. Maintain legacy migration logic but remove legacy key writes
4. Update App.svelte to call single initialization method
5. Test loading/saving with both new and legacy data formats
6. Clean up old localStorage keys after successful migration