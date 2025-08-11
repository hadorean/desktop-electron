# Reactive Image Grid Implementation Plan

Date: 2025-08-11

## Overview

Make the ImageGrid component reactive to file system changes by implementing a store-based architecture that automatically updates when images are added/removed from the file system.

## Current State Analysis

- **File Watching**: Already exists in `ImageService` with cache invalidation on file changes
- **Image Loading**: Apps manually fetch images via `api.getImages()` in App.svelte components
- **ImageGrid**: Currently receives images as props, handles selection/override/favorites
- **Socket.IO**: Infrastructure exists for real-time communication

## Implementation Phases

### Phase 1: Create Image Store & Refactor ImageGrid

**Goal**: Replace prop-based image passing with a centralized reactive store

**Tasks**:

1. Create `imagesStore.ts` in `pkg/shared/src/stores/`
   - `images` writable store containing `ImageInfo[]`
   - `loadImages()` function to fetch from API
   - `isLoading` derived store for loading states
   - Export store and functions

2. Refactor `ImageGrid.svelte`
   - Replace `images` prop with store subscription
   - Preserve all existing functionality (selection, override mode, favorites)
   - Maintain same component interface except removing images prop

3. Update App components
   - `pkg/app/src/renderer/src/App.svelte`: Use store instead of local state
   - `pkg/client/src/App.svelte`: Use store instead of local state
   - Call `loadImages()` on mount instead of manual API calls

4. Update `SettingsPanel.svelte`
   - Remove `images` prop from component
   - Update ImageGrid usage to not pass images prop

**Success Criteria**: ImageGrid works exactly as before but uses store-based data

### Phase 2: App-Side Store Integration with File Watcher

**Goal**: Make the store automatically refresh when file system changes occur

**Tasks**:

1. Integrate with existing `ImageService` file watcher
   - Modify file watcher callback to trigger store updates
   - Use existing cache invalidation mechanism
   - Ensure store updates when files are added/removed

2. App-side store management
   - Consider if app process needs its own store instance
   - Coordinate between main process file watching and renderer store

**Success Criteria**: Images automatically refresh in UI when files change on disk

### Phase 3: Socket Communication for Real-time Sync

**Goal**: Propagate image changes from app to all client windows

**Tasks**:

1. Extend socket event types
   - Add `images_updated` event to `SocketEvents`
   - Update `ServerEventMap` and `ClientEventMap` types
   - Define event payload structure

2. Server-side implementation
   - Observe image store changes in main process
   - Emit `images_updated` socket events to all clients
   - Include necessary data (updated images list, timestamp)

3. Client-side implementation
   - Listen for `images_updated` socket events
   - Update local image store when events received
   - Handle potential race conditions

**Success Criteria**: All windows (desktop app + browser clients) update simultaneously when files change

## Technical Considerations

### Store Design

- Use Svelte's writable store pattern
- Include loading states and error handling
- Cache images to prevent unnecessary API calls
- Thread-safe operations for concurrent access

### Performance

- Leverage existing ImageService caching
- Debounce file watcher events to prevent excessive updates
- Only emit socket events when images actually change

### Error Handling

- Graceful fallback if API calls fail
- Handle network disconnections for socket events
- Preserve existing image list if refresh fails

### Backward Compatibility

- Each phase maintains existing functionality
- No breaking changes to ImageGrid component behavior
- Preserve selection state during updates

## Files to be Modified/Created

### New Files

- `pkg/shared/src/stores/imagesStore.ts`
- `docs/memories/2025-08/2025-08-11-image-grid-reactive-store.md` (this file)

### Modified Files

- `pkg/shared/src/components/settings/ImageGrid.svelte`
- `pkg/shared/src/components/settings/SettingsPanel.svelte`
- `pkg/app/src/renderer/src/App.svelte`
- `pkg/client/src/App.svelte`
- `pkg/shared/src/stores/index.ts` (export new store)
- `pkg/shared/src/types/sockets.ts` (Phase 3)
- `pkg/app/src/main/server/sockets.ts` (Phase 3)
- `pkg/app/src/main/services/images.ts` (Phase 2)

## Testing Strategy

- Test each phase independently
- Verify ImageGrid functionality preserved
- Test file watcher integration
- Test socket communication between app and clients
- Performance testing with large image collections

## Success Metrics

1. **Phase 1**: ImageGrid works identically but uses store
2. **Phase 2**: Images auto-refresh when files change locally
3. **Phase 3**: All clients update when any file changes occur
4. **Overall**: Zero regression in existing functionality
