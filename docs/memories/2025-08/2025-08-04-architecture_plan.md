# Electron App Architecture Plan

## Overview

Modern desktop background application with web demo capabilities and real-time state synchronization between multiple clients.

## Architecture Decision: Monorepo ✅

### Why Monorepo:

- **Single source of truth** - All code in one place
- **Shared dependencies** - Avoid version conflicts
- **Easier deployment** - One build process
- **Better development experience** - Hot reload for both client and server
- **Simplified CI/CD** - One pipeline
- **Type sharing** - Can share TypeScript interfaces between client/server

## Technology Stack

### Core Technologies:

- **Electron** - Desktop application framework
- **Svelte** - Frontend framework (both Electron and Web)
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety across the stack
- **Express.js** - HTTP server
- **Socket.IO** - Real-time communication

### Dependencies:

- **express** - HTTP server framework
- **cors** - Cross-origin request support
- **socket.io** - Real-time WebSocket communication (planned)
- **sharp** - High-performance image processing for thumbnails
- **@types/express, @types/cors, @types/sharp** - TypeScript definitions

## Project Structure

```
electron-app/
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.ts       # Main process entry point
│   │   ├── server.ts      # Express server with image APIs
│   │   └── services/      # Server services
│   │       └── thumbnail-service.ts  # Sharp-based thumbnail generation
│   ├── preload/           # Electron preload scripts
│   │   ├── index.ts       # Preload script
│   │   └── index.d.ts     # Type definitions
│   ├── renderer/          # Svelte app (Electron UI - full features)
│   │   ├── src/
│   │   ├── index.html
│   │   └── main.ts
│   └── shared/            # Shared types and utilities
│       ├── types.ts       # Shared TypeScript interfaces
│       ├── state.ts       # State management
│       └── constants.ts   # Shared constants
├── client/                # Web client (Svelte + Vite - demo features)
│   ├── src/
│   │   ├── App.svelte
│   │   ├── main.ts
│   │   └── components/
│   ├── public/
│   ├── index.html
│   ├── package.json       # Web client dependencies
│   └── vite.config.ts     # Web client build config
├── docs/                  # Documentation
│   ├── architecture_plan.md     # This file
│   ├── api_errors.md            # API error documentation
│   ├── dynamic_serving_plan.md  # Future: Dynamic serving architecture
│   ├── development_experience.md # Development workflow with hot reload
│   └── implementation_phases.md  # Implementation roadmap
├── package.json           # Root package.json
└── electron.vite.config.ts
```

## Real-time Sync Strategy

### Technology: Socket.IO

**Why Socket.IO over SignalR:**

- **Simpler setup** - Works great with Express.js
- **Better TypeScript support** - Native TypeScript
- **Cross-platform** - Works in Electron and browsers
- **Room-based** - Perfect for multiple client sync
- **Less complexity** - No .NET dependency

### State Management:

```typescript
// Shared state interface
export interface AppState {
	theme: 'light' | 'dark'
	settings: UserSettings
	// ... other shared state
}

export interface SyncMessage {
	type: 'state_update' | 'user_action'
	payload: any
	timestamp: number
	clientId: string
}
```

### Sync Features:

- **Settings sync** - JSON settings synchronized between clients
- **Local storage** - Settings persisted on local machine
- **Real-time updates** - Instant sync across all connected clients
- **Room-based** - Clients can join specific rooms for targeted sync

## Implementation Phases

### Phase 1: Monorepo Setup ✅ (COMPLETED)

- [x] Express server running on port 8080
- [x] Basic API endpoints (/health, /api/info)
- [x] Close to tray functionality
- [x] Clean project structure

### Phase 2: Web Client Setup

- [x] Create `client/` directory
- [x] Set up Svelte + Vite for web client
- [x] Configure shared types in `src/shared/`
- [x] Basic web client with demo UI

### Phase 2.1: Server API ✅ (COMPLETED)

- [x] Server exposes GET /api/images endpoint to return a list of all { thumbnail, image_name }
- [x] Server exposes GET /api/image?name={name} endpoint to return the image data
- [x] Server exposes GET /api/thumbnail?name={name} endpoint to return Sharp-generated thumbnails
- [x] Thumbnail service with async queue system and background generation
- [x] Smart caching with freshness checks (regenerate if source image is newer)
- [x] Debug endpoints: GET /api/thumbnails/status, POST /api/thumbnails/clear-cache

### Phase 2.2: Settings ✅ (COMPLETED)

- [x] Server uses Socket.IO to communicate with clients
- [x] Server pushes update-settings socket messages to other connected clients when a client update settings
- [x] Server pushes stored settings to a newly connected client
- [x] Server exposes POST /update-settings API endpoint to update the settings
- [x] Server exposes GET /api/settings API endpoint to retrieve current settings
- [x] Server stores settings in memory and persists in local file system
- [x] When requested settings are not found in memory, server will load them from local file system
- [x] Settings service with in-memory caching and file system persistence
- [x] Real-time Socket.IO communication for settings synchronization

### Phase 3: Client Socket.IO ✅ (COMPLETED)

- [x] Web client connects to server: Replace current SignalR implementation by Socket.IO
- [x] Socket.IO client service with automatic reconnection
- [x] Real-time settings synchronization between client and server
- [x] Connection status indicator in client UI
- [x] Settings update broadcasting to all connected clients
- [x] Graceful handling of connection errors and reconnection

### Phase 4: Real-time Sync Implementation

- [ ] Electron client connects to WebSocket
- [ ] Web client connects to WebSocket
- [ ] Implement settings sync
- [ ] Add local storage persistence
- [ ] Test multi-client sync

### Phase 5: Demo Features

- [ ] Limited feature set for web client
- [ ] Preset images instead of user images
- [ ] No settings saving in demo
- [ ] Demo-specific UI components
- [ ] Real-time sync between demo clients

### Phase 6: Production Features

- [ ] Import existing client/server code
- [ ] Add authentication (existing implementation)
- [ ] Full feature parity for Electron app
- [ ] Production deployment setup

## Feature Comparison

### Electron App (Full Features):

- ✅ Full settings management
- ✅ User image upload/management
- ✅ Local storage persistence
- ✅ Real-time sync with other clients
- ✅ Close to tray functionality
- ✅ Native desktop integration

### Web Client (Demo Features):

- ❌ No settings saving
- ✅ Preset images only
- ✅ Real-time sync with other clients
- ✅ Demo-specific UI
- ✅ Browser-based access
- ❌ No local storage persistence

## API Endpoints

### HTTP Endpoints:

#### Core Endpoints:

- `GET /` - Server status page
- `GET /health` - Health check
- `GET /api/info` - Application information

#### Image API ✅ (IMPLEMENTED):

- `GET /api/images` - List all available images with thumbnail URLs
- `GET /api/image?name={name}` - Serve original image files
- `GET /api/thumbnail?name={name}` - Serve Sharp-generated thumbnails (200x200px JPEG)

#### Thumbnail Service ✅ (IMPLEMENTED):

- `GET /api/thumbnails/status` - Get thumbnail service queue status
- `POST /api/thumbnails/clear-cache` - Clear thumbnail cache (development)

#### Features:

- **Smart Caching**: Thumbnails regenerated only if source image is newer
- **Background Generation**: All thumbnails generated on app startup
- **Async Queue**: On-demand generation with duplicate request prevention
- **Error Handling**: Graceful handling of unsupported formats
- **Security**: Path traversal protection and file validation

#### Settings API ✅ (IMPLEMENTED):

- `GET /api/settings` - Retrieve current settings from memory/file system
- `POST /api/update-settings` - Update settings with JSON payload

#### Socket.IO Events ✅ (IMPLEMENTED):

- `connection` - Client connects and receives current settings
- `update_settings` - Client sends settings update
- `settings_update` - Server broadcasts settings changes to all clients
- `settings_updated` - Server acknowledges successful settings update
- `disconnect` - Client disconnects

#### Settings Features:

- **Memory Caching**: Settings stored in memory for fast access
- **File Persistence**: Settings saved to userData/settings.json
- **Real-time Sync**: Socket.IO broadcasts updates to all connected clients
- **Default Values**: Fallback to defaults when settings file doesn't exist
- **Type Safety**: TypeScript interfaces for settings structure

#### Socket.IO Client ✅ (IMPLEMENTED):

**Service Features:**

- **Automatic Reconnection**: Built-in retry logic with configurable attempts
- **Connection Status**: Real-time connection state monitoring
- **Event Handlers**: Typed event handling for settings updates
- **Error Handling**: Graceful degradation when connection fails
- **URL Management**: Dynamic server URL updates with reconnection

**Client Implementation:**

- **SocketService**: Singleton service managing Socket.IO connection (`client/src/lib/services/socket.ts`)
- **Connection Status UI**: Visual indicator showing connection state
- **Settings Sync**: Bidirectional settings synchronization
- **Event Types**: TypeScript interfaces for Socket.IO events

## Development Commands

### Root Level:

```bash
npm run dev          # Start Electron app + server
npm run build        # Build all components
npm run start        # Start production build
```

### Web Client:

```bash
cd client
npm run dev          # Start web client dev server
npm run build        # Build web client
```

## Deployment Strategy

### Development:

- Electron app: `http://localhost:5173/` (Vite dev server)
- Web client: `http://localhost:3000/` (Express server)
- Server: `http://localhost:8080/` (Express + Socket.IO)

### Production:

- Web client: Vercel (landing page and demo)
- Server: Self-hosted (runs on client machine)
- Electron app: Desktop distribution

## Notes

### Authentication:

- Demo: No authentication required
- Production: Use existing authentication implementation

### State Persistence:

- Electron: Local file system
- Web Demo: Session storage only
- Sync: Real-time via Socket.IO

### Performance Considerations:

- **Thumbnail Optimization**: 200x200px JPEG thumbnails reduce bandwidth by ~95%
- **Smart Caching**: Thumbnails only regenerated when source images change
- **Background Processing**: Async queue prevents UI blocking during generation
- **Efficient Storage**: Thumbnails stored in app userData with preserved folder structure
- Socket.IO with room-based sync for scalability (planned)
- Local storage for offline capability
- Efficient state diffing for minimal network traffic

## Future Considerations

### Scalability:

- Multiple rooms for different user groups
- State compression for large datasets
- Connection pooling for many clients

### Features:

- **Dynamic Serving Architecture**: Planned server-side rendering with demo/full feature gating
- **Multiple Client Types**: Electron (full), Web Demo (limited), Web Full (authenticated)
- **Enhanced Development**: Multi-mode hot reload development environment
- File sharing between clients
- Collaborative editing
- Offline mode with sync on reconnect
- Push notifications

---

_Last updated: [Current Date]_
_Status: Phase 1 Complete - Ready for Phase 2_
