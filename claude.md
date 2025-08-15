# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a desktop wallpaper and background management application called "HeyKetsu" that provides a peaceful space for desktop and browser environments. The application allows users to control window backgrounds, browser new tabs, manage multiple monitors, and add UI elements like time, date, and weather.

## Architecture

The project uses a monorepo structure with three main packages:

- **pkg/app**: Electron desktop application (main process, renderer, preload)
- **pkg/client**: Svelte Kit client app that runs in browsers and background windows
- **pkg/shared**: Shared code, components, types, and utilities used by both app and client

### Key Components

- **LocalServer** (pkg/app/src/main/server/): Express server that serves the client app and provides API endpoints
- **BackgroundManager** (pkg/app/src/main/windows/backgrounds.ts): Manages background windows for each monitor
- **SocketManager** (pkg/app/src/main/server/sockets.ts): Real-time communication via Socket.IO
- **Settings System**: Shared settings with screen-specific overrides, managed through adapters


## Planning and execution

When exiting plan mode, always do this first:
 - Write the plan in docs/memories/YYYY-MM/YYYY-MM-DD-topic.md
 - Set the date after the doc title: Date: YYYY-MM-DD
 - Create a branch feature/<topic>
 - Commit the plan to the branch right away: "<Topic> plan"

During execution:
 - Commit regularly (each phase)
 - Use 'pnpm typecheck', 'pnpm format' and 'pnpm lint' to detect and address issues before commiting
 - Use 'pnpm dev' if you need to run the app.

## Coding style

- Don't use dynamic imports when static imports are possible
- Group imports when possible

## Stores

- Use stores as an observable, inspectable single source of truth for managing state
- Store should be self-contained. Don't add dependencies to store.
  Instead, use a services to modify and observe stores to handle side effects (networking, file system etc.)
- Use createStore from $shared/stores/createStore.ts to create store properties
  Use store, get and set when applicable, not systematically.
  ```ts
  export const { store: currentPage, get: getCurrentPage, set: gotoPage } = createStore<Page>('main')
  ```

### Svelte Store Object Pattern

Create a single export object that contains all reactive stores and functions, using getters for derived stores to maintain reactivity with Svelte's $ syntax.

#### Key characteristics:
  - Single export const storeName = { ... } object
  - Individual stores as properties (for direct access)
  - Functions defined as methods within the object
  - Use this.methodName() for internal method calls
  - Import and destructure individual stores: const { store1, store2 } = storeName

#### Example
```ts
// Store structure
export const storeName = {
  // Reactive stores
  store1: derived(internalStore, $s => $s.prop1),
  store2: derived(internalStore, $s => $s.prop2),
  
  // Functions
  async loadData() { /* implementation */ },
  updateData(value) { /* implementation */ },
  getCurrentValue() { return get(store1) }
}
```

#### Usage
```ts
// Import and destructure
import { storeName } from './store'
const { store1, store2 } = storeName

// Reactive in components
$: console.log($store1, $store2)
storeName.loadData()
```

### Styling

- Don't use tailwind classes, use meaningfull class names and semantic css
- Use global css variables for theming

### Components

- Breakdown repetitive html patterns into {#snippet}
- Use shadcn-svelte components when possible
- When creating a new shadcn component:
  - Replace tailwind classes with meaningfull class names
  - Use {children?.render()} pattern instead of <slot/>

## Development Commands

### Primary Development

```bash
# Start all services in development mode (shared, client, electron)
pnpm dev

# Alternative using justfile
just dev
```

### Building

```bash
# Build all packages
pnpm build:all

# Build individual packages
pnpm build:shared
pnpm build:client
pnpm build:app
```

### Testing and Quality

```bash
# Lint code (runs in pkg/app)
pnpm lint

# Type checking
pnpm typecheck

# Format code
pnpm format
```

### Packaging

```bash
# Create unpacked build for testing
pnpm package:unpack

# Build for specific platforms
pnpm package:win
pnpm package:mac
pnpm package:linux
```

## Package Manager

This project uses **pnpm** exclusively. The `preinstall` script enforces this with `npx only-allow pnpm`.

## Key Technologies

- **Electron 37**: Desktop app framework
- **Svelte 5**: Frontend framework for both desktop and client apps
- **SvelteKit**: Used in the client package for browser/background windows
- **Express**: Local server for API and static file serving
- **Socket.IO**: Real-time communication between components
- **Sharp**: Image processing for thumbnails and backgrounds
- **electron-as-wallpaper**: Sets windows as desktop wallpaper

## Development Notes

- The app runs a local Express server on port 8080 (auto-increments if busy)
- Background windows are created for each monitor and served from the local server
- Development mode supports rapid development with file watching and automatic reloading
- The client app can run standalone in browsers or embedded in background windows

## Documentation

Relevant docs can be found in docs/
When creating topic-related documents, use the following format: YYYY-MM-DD-topic.md
Set the date after the doc title: Date: YYYY-MM-DD
Place new documents in the docs/memories/YYYY-MM directory.

## Do / Don't

- Don't delete files created by the user that are not version controlled
