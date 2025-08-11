# Code Sharing Problem Documentation

## Problem Statement

Currently, the Hey Ketsu project consists of two separate applications:

- **Electron App** (`/app`): Desktop application with main process, renderer, and preload scripts
- **Client App** (`/client`): SvelteKit application that runs in browser and background windows

Both applications need to share TypeScript code including:

- Type definitions (settings, API interfaces, socket events)
- Utility functions (validation, formatting, helpers)
- Constants and enums
- Business logic components

## Current Architecture Issues

1. **Code Duplication**: Similar types and utilities are defined in both projects
2. **Type Safety**: No shared type definitions between Electron app and client
3. **Maintenance Overhead**: Changes need to be manually synchronized across projects
4. **Inconsistency Risk**: Logic can diverge between the two applications
5. **Development Experience**: No IntelliSense/autocomplete for shared interfaces

## Available Solutions

### 1. Shared Package/Library

**Approach**: Create a separate npm package that both projects depend on

- **Pros**: Clean separation, proper versioning, can be published
- **Cons**: Overhead of package management, build complexity
- **Use Case**: Best for mature projects with stable shared APIs

### 2. TypeScript Project References

**Approach**: Use TypeScript's project reference feature to link projects

- **Pros**: Native TypeScript solution, good IDE support
- **Cons**: Limited to TypeScript, can be complex with build tools
- **Use Case**: TypeScript-heavy projects with complex build requirements

### 3. Symbolic Links

**Approach**: Create symlinks to share directories between projects

- **Pros**: Simple, immediate, no build changes needed
- **Cons**: Platform-specific, can break with some tools, Git issues
- **Use Case**: Quick prototyping or temporary solutions

### 4. Monorepo with Workspaces

**Approach**: Restructure project as a monorepo with npm/yarn workspaces

- **Pros**: Single dependency tree, consistent tooling, easy cross-package development
- **Cons**: Initial migration complexity, potential tool compatibility issues
- **Use Case**: Multi-package projects with shared dependencies

### 5. Git Submodules

**Approach**: Use git submodules to share code repositories

- **Pros**: Version control integration, can share with other projects
- **Cons**: Complex workflow, easy to break, poor developer experience
- **Use Case**: Sharing code across multiple unrelated projects

### 6. Manual Copy/Sync

**Approach**: Manually maintain copies with build scripts to sync

- **Pros**: Full control, simple to understand
- **Cons**: Error-prone, manual overhead, easy to forget
- **Use Case**: Small projects with minimal shared code

## Current Project Structure

```
electron-bg/
├── app/                    # Electron application
│   ├── src/
│   │   ├── main/          # Main process
│   │   ├── renderer/      # Renderer process
│   │   ├── preload/       # Preload scripts
│   │   └── shared/        # Empty shared directory
│   └── package.json
├── client/                 # SvelteKit client
│   ├── src/
│   │   ├── lib/
│   │   │   ├── services/  # API and socket services
│   │   │   └── stores/    # Svelte stores
│   │   └── main.ts
│   └── package.json
└── package.json           # Root package.json
```

## Shared Code Candidates

Based on current codebase analysis:

1. **Type Definitions**
   - Settings interfaces
   - API request/response types
   - Socket event definitions
   - Error types

2. **Services**
   - API client logic
   - Socket.io event handlers
   - Validation utilities

3. **Constants**
   - Default settings
   - API endpoints
   - Socket event names

4. **Utilities**
   - Data formatting
   - Validation helpers
   - Configuration parsers

## Success Criteria

A successful code sharing solution should:

- ✅ Enable type-safe communication between Electron and client
- ✅ Reduce code duplication
- ✅ Maintain fast development workflows
- ✅ Support hot reloading in development
- ✅ Work with existing build tools (electron-vite, Vite)
- ✅ Not break Electron packaging
- ✅ Provide good IDE support and IntelliSense
