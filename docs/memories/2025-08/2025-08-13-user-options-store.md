# UserOptions Store Implementation

Date: 2025-08-13

## Overview

Implementation plan for a reactive user options system with image directory selection, following the established store patterns in the HeyKetsu codebase.

## Problem Statement

Currently, the image directory is hardcoded to `D:\pictures\wall` in both ImageService and ThumbnailService. Users cannot change the directory where the application loads wallpaper images from. This limitation reduces the application's flexibility and user experience.

## Solution Architecture

Implement a reactive store-based system that allows users to configure the image directory through the options UI, with automatic propagation to all dependent services.

### Key Components

1. **UserOptions Store** (`pkg/shared/src/stores/userOptionsStore.ts`)
   - Reactive Svelte store following existing patterns
   - Single source of truth for user options
   - Loading/error state management
   - Change callbacks for service integration

2. **UserOptions Service** (`pkg/app/src/main/services/user-options.ts`)
   - File persistence to `userData/user-options.json`
   - Automatic save on store changes (except initial load)
   - Integration with main process store

3. **IPC Interface**
   - Renderer ↔ Main process communication
   - Following existing IPC patterns in the codebase

4. **Service Reactivity**
   - ImageService subscribes to directory changes
   - ThumbnailService updates path dynamically
   - Automatic background refresh on directory change

## Implementation Phases

### Phase 1: Core Infrastructure
- UserOptions types and interfaces
- Reactive store implementation
- File persistence service

### Phase 2: IPC Integration
- Add IPC events and handlers
- Expose API to renderer process
- Connect store to main process services

### Phase 3: Service Reactivity
- Make ImageService reactive to directory changes
- Update ThumbnailService with dynamic paths
- Implement automatic refresh mechanisms

### Phase 4: UI Integration
- Connect OptionsScreen to store
- Add loading states and error handling
- Provide user feedback for directory changes

### Phase 5: Testing & Validation
- Test directory changes across monitors
- Validate thumbnail generation in new directories
- Ensure socket communication works properly

## Technical Decisions

### Store Pattern Choice
Following the existing `settingsStore.ts` and `imagesStore.ts` patterns:
- `writable` store with derived stores for specific values
- Loading state management with error handling
- Prevention flags to avoid sync loops during initial load
- Change callbacks for cross-component communication

### File Persistence
- Store in `userData/user-options.json` (separate from screen settings)
- Automatic persistence on store changes
- Graceful fallback to defaults on file corruption

### Service Integration
- Services subscribe to store changes via derived stores
- Automatic restart of file watchers and image scanning
- Socket emission for background window updates

## Benefits

1. **User Experience**: Users can select any folder for wallpapers
2. **Reactive Architecture**: Changes automatically propagate to all components
3. **Consistent Patterns**: Follows established codebase conventions
4. **Extensible**: Easy to add more user options in the future
5. **Reliable**: Proper error handling and fallback mechanisms

## Files Modified

### New Files
- `pkg/shared/src/types/user-options.ts`
- `pkg/shared/src/stores/userOptionsStore.ts`  
- `pkg/app/src/main/services/user-options.ts`

### Modified Files
- `pkg/shared/src/types/ipc.ts` (add IPC events)
- `pkg/app/src/preload/index.ts` (expose API methods)
- `pkg/app/src/main/services/ipc.ts` (add handlers)
- `pkg/app/src/main/services/images.ts` (subscribe to store)
- `pkg/app/src/main/services/thumbnails.ts` (dynamic path)
- `pkg/app/src/main/index.ts` (initialize service)
- `pkg/app/src/renderer/src/components/OptionsScreen.svelte` (use store)

## Testing Strategy

- Use `pnpm dev` for real-time development testing
- Validate across multiple monitors
- Test persistence across app restarts
- Verify thumbnail generation in new directories
- Ensure background refresh works correctly

## Future Considerations

This implementation provides a foundation for additional user options such as:
- Thumbnail cache settings
- File format preferences
- UI customization options
- Performance tuning parameters