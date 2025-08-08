# Main UI Migration - Part 2: Unified Socket.IO Architecture

Date: 2025-08-07

## Context

After successfully implementing basic app settings with IPC adapters, we identified significant UI disparity between the client and app, plus the need for real-time two-way communication. The current approach uses different communication patterns (HTTP+Socket.IO for client, IPC for app), leading to code duplication and complexity.

## Goal

Create a unified architecture where both client and app renderer use identical services, stores, and components via Socket.IO communication, achieving complete UI parity and real-time synchronization.

## Architectural Decision: Unified Socket.IO

**Key Insight**: App renderer should use Socket.IO (connecting to localhost) instead of IPC, enabling:
- Same `api.ts` and `socket.ts` services for both environments
- Identical store implementations and behavior  
- Complete component reuse without modifications
- Automatic real-time bidirectional sync

## Implementation Plan

### Phase 1: Move Core Services & Stores to Shared (Unified Foundation)
- **Move `api.ts` service** to `pkg/shared/src/services/api.ts`
- **Move `socket.ts` service** to `pkg/shared/src/services/socket.ts` 
- **Move `settingsStore.ts`** to shared with Socket.IO integration
- **Move/rename `routeStore.ts`** to `screenStore.ts` in shared
- Remove HTTP-specific and IPC adapters (unified Socket.IO approach)
- Add URL injection mechanism for different environments

### Phase 3: App Renderer as Localhost Client (Unified Communication)
- **Add IPC for server URL**: `window.api.getServerUrl()` in preload
- **Replace IPC adapters** with shared Socket.IO services
- App renderer connects to `localhost:port` Socket.IO server
- **Update app store initialization** to use shared services with localhost URL
- Remove all direct IPC adapter usage in renderer components

### Phase 4: Real-time Sync (Automatic via Socket.IO)
- Real-time sync works automatically with shared Socket.IO services
- Both client and app get identical real-time updates
- **Test bidirectional sync**: Client changes ↔ App changes via Socket.IO
- Main process only handles file I/O, not settings communication

### Phase 2: Move Complete UI to Shared (Identical Components)
- **Move `ImageGrid.svelte`** to shared (uses shared API service)
- **Move full `SettingsPanel.svelte`** with all controls and styling
- **Update both environments** to use identical shared components
- Remove basic `AppSettings.svelte` - replace with shared `SettingsPanel`
- Components work identically since they use same services/stores

### Phase 5: Styling & Polish (Visual Consistency)
- Apply consistent dark theme styling across environments
- Fix any app-specific styling issues with shared components
- Add shared CSS variables for theming
- Ensure responsive design works in app window context

## Architecture Result

```
Before:
Client (web):     SettingsPanel → HTTP API → Server
App (electron):   AppSettings → IPC → Main Process → File System
                  ↑ Different components, communication, no sync

After:
Client (web):     SettingsPanel → Shared Store → Socket.IO → Server
App (renderer):   SettingsPanel → Shared Store → Socket.IO → Server (localhost)
                  ↑ Identical components, services, and stores
```

## Key Benefits

- ✅ **Maximum code reuse**: Identical services, stores, UI components
- ✅ **Simplified maintenance**: Single codebase for both environments  
- ✅ **Automatic real-time sync**: Built into Socket.IO architecture
- ✅ **Consistent behavior**: Same error handling, retry logic, updates
- ✅ **Easy testing**: Same API surface and communication patterns
- ✅ **Complete UI parity**: Rich settings panel in both environments

## Implementation Status

- [x] Basic IPC adapter approach (Part 1)
- [x] Phase 1: Move services & stores to shared
- [x] Phase 3: App as localhost client
- [x] Phase 4: Real-time sync via Socket.IO
- [x] Phase 2: Unified component architecture
- [x] Phase 5: Styling & polish

## Final Result

✅ **Complete Success**: All phases implemented successfully

**Achieved:**
- Unified Socket.IO architecture for both client and app
- Shared services (API, Socket.IO) with environment-specific initialization  
- Shared reactive stores with adapter pattern
- App renderer connecting to localhost server as Socket.IO client
- Real-time bidirectional sync capability via Socket.IO
- Consistent dark theme styling matching client design
- Clean separation of concerns with maintainable architecture

**Architecture Summary:**
```
Client (web):     SettingsPanel → Shared Store → Socket.IO → Server
App (renderer):   SettingsPanel → Shared Store → Socket.IO → Server (localhost)
                  ↑ Identical services, stores, and communication patterns
```