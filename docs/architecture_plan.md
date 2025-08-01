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
- **socket.io** - Real-time WebSocket communication
- **@types/express, @types/cors, @types/socket.io** - TypeScript definitions

## Project Structure

```
electron-app/
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.ts       # Main process entry point
│   │   └── server.ts      # Express + Socket.IO server
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
├── package.json           # Root package.json
└──  electron.vite.config.ts
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
- [ ] Create `client/` directory
- [ ] Set up Svelte + Vite for web client
- [ ] Configure shared types in `src/shared/`
- [ ] Basic web client with demo UI
- [ ] Web client connects to server

### Phase 3: Socket.IO Integration
- [ ] Add Socket.IO to Express server
- [ ] Implement room-based sync
- [ ] Add state management utilities
- [ ] Create shared state interfaces

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
- `GET /` - Server status page
- `GET /health` - Health check
- `GET /api/info` - Application information

### WebSocket Events:
- `connect` - Client connected
- `disconnect` - Client disconnected
- `join_room` - Join sync room
- `leave_room` - Leave sync room
- `state_update` - State change broadcast
- `settings_sync` - Settings synchronization

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
- Socket.IO with room-based sync for scalability
- Local storage for offline capability
- Efficient state diffing for minimal network traffic

## Future Considerations

### Scalability:
- Multiple rooms for different user groups
- State compression for large datasets
- Connection pooling for many clients

### Features:
- File sharing between clients
- Collaborative editing
- Offline mode with sync on reconnect
- Push notifications

---

*Last updated: [Current Date]*
*Status: Phase 1 Complete - Ready for Phase 2* 