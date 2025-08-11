# Dependency Analysis

## App Package Dependencies

### Production Dependencies

```json
{
	"@electron-toolkit/preload": "^3.0.2",
	"@electron-toolkit/utils": "^4.0.0",
	"@types/ejs": "^3.1.5",
	"@types/sharp": "^0.31.1",
	"@types/socket.io": "^3.0.1",
	"cors": "^2.8.5",
	"ejs": "^3.1.10",
	"electron-as-wallpaper": "^2.0.3",
	"electron-updater": "^6.3.9",
	"express": "^5.1.0",
	"sharp": "^0.34.3",
	"socket.io": "^4.8.1"
}
```

### Development Dependencies

```json
{
	"@electron-toolkit/eslint-config-prettier": "^3.0.0",
	"@electron-toolkit/eslint-config-ts": "^3.0.0",
	"@electron-toolkit/tsconfig": "^1.0.1",
	"@sveltejs/vite-plugin-svelte": "^6.1.0",
	"@types/cors": "^2.8.19",
	"@types/express": "^5.0.3",
	"@types/node": "^22.16.5",
	"chokidar": "^4.0.3",
	"concurrently": "^9.2.0",
	"cross-env": "^10.0.0",
	"electron": "^37.2.3",
	"electron-builder": "^25.1.8",
	"electron-vite": "^4.0.0",
	"eslint": "^9.31.0",
	"eslint-plugin-svelte": "^3.11.0",
	"nodemon": "^3.1.10",
	"prettier": "^3.6.2",
	"prettier-plugin-svelte": "^3.4.0",
	"svelte": "^5.36.10",
	"svelte-check": "^4.3.0",
	"typescript": "^5.8.3",
	"vite": "^7.0.5",
	"wait-on": "^8.0.4"
}
```

### Build Scripts

```json
{
	"format": "prettier --plugin prettier-plugin-svelte --write .",
	"lint": "eslint --cache .",
	"typecheck:node": "tsc --noEmit -p tsconfig.node.json --composite false",
	"svelte-check": "svelte-check --tsconfig ./tsconfig.json",
	"typecheck": "npm run typecheck:node && npm run svelte-check",
	"start": "electron-vite preview",
	"dev:electron": "electron-vite dev",
	"dev": "concurrently --kill-others --names \"CLIENT,ELECTRON\" --prefix-colors \"blue,green\" \"npm run dev:client:start\" \"npm run dev:electron:start\"",
	"dev:client:start": "cd ../client && npm run dev",
	"dev:electron:start": "node ../scripts/wait-for-client.js && cross-env NODE_ENV=development npm run dev:electron",
	"dev:templates:watch": "nodemon --watch src/main/templates --ext ejs --exec \"echo Templates changed - refresh browser\"",
	"dev:client:build": "cd ../client && npm run build",
	"build": "npm run typecheck && electron-vite build",
	"build:client": "cd ../client && npm run build",
	"build:demo": "cd ../client && npm run build:demo",
	"build:web": "cd ../client && npm run build:web",
	"build:all": "npm run build:client && npm run build",
	"postinstall": "electron-builder install-app-deps",
	"build:unpack": "npm run build:all && electron-builder --dir",
	"build:win": "npm run build:all && electron-builder --win",
	"build:mac": "npm run build:all && electron-builder --mac",
	"build:linux": "npm run build:all && electron-builder --linux"
}
```

## Client Package Dependencies

### Production Dependencies

```json
{
	"@tweenjs/tween.js": "^25.0.0",
	"socket.io-client": "^4.8.1"
}
```

### Development Dependencies

```json
{
	"@sveltejs/vite-plugin-svelte": "^5.0.3",
	"@tsconfig/svelte": "^5.0.4",
	"@types/node": "^22.13.10",
	"autoprefixer": "^10.4.16",
	"daisyui": "^3.9.4",
	"postcss": "^8.4.31",
	"svelte": "^5.20.2",
	"svelte-check": "^4.1.4",
	"tailwindcss": "^3.3.5",
	"typescript": "~5.7.2",
	"vite": "^6.2.0"
}
```

### Build Scripts

```json
{
	"dev": "vite",
	"build": "vite build",
	"build:demo": "vite build --config vite.demo.config.ts",
	"preview": "vite preview",
	"preview:demo": "vite preview --config vite.demo.config.ts",
	"check": "svelte-check --tsconfig ./tsconfig.app.json && tsc -p tsconfig.node.json"
}
```

## Shared Dependencies Analysis

### Dependencies that can be hoisted to root:

#### Development Dependencies (can be shared)

- `@sveltejs/vite-plugin-svelte`: Version conflict (app: ^6.1.0, client: ^5.0.3) ❌
- `@tsconfig/svelte`: Same (^5.0.4) ✅
- `@types/node`: Version conflict (app: ^22.16.5, client: ^22.13.10) ❌
- `autoprefixer`: Only in client (^10.4.16)
- `daisyui`: Only in client (^3.9.4)
- `eslint`: Only in app (^9.31.0)
- `eslint-plugin-svelte`: Only in app (^3.11.0)
- `postcss`: Only in client (^8.4.31)
- `prettier`: Only in app (^3.6.2)
- `prettier-plugin-svelte`: Only in app (^3.4.0)
- `svelte`: Version conflict (app: ^5.36.10, client: ^5.20.2) ❌
- `svelte-check`: Version conflict (app: ^4.3.0, client: ^4.1.4) ❌
- `tailwindcss`: Only in client (^3.3.5)
- `typescript`: Version conflict (app: ^5.8.3, client: ~5.7.2) ❌
- `vite`: Version conflict (app: ^7.0.5, client: ^6.2.0) ❌

#### Production Dependencies

- `socket.io` (app) vs `socket.io-client` (client): Related but different packages ✅

### Summary of Conflicts

- **Major version conflicts**: 6 dependencies with different versions
- **Svelte ecosystem**: Different versions across the stack
- **TypeScript**: Different version constraints
- **Vite**: Major version difference (v6 vs v7)

### Recommendations for Hoisting

1. **Can hoist immediately**: `@tsconfig/svelte`
2. **Can hoist after version alignment**: All conflicting deps need version sync
3. **Keep separate**: Electron-specific deps (`electron`, `electron-builder`, etc.)
4. **Project-specific**: `daisyui`, `tailwindcss` (client), `sharp`, `express` (app)

## Build Script Interdependencies

### Root Package Scripts

```json
{
	"dev": "concurrently --kill-others --names \"CLIENT,ELECTRON\" --prefix-colors \"blue,green\" \"npm run dev:client:start\" \"npm run dev:electron:start\"",
	"dev:client:start": "cd client && npm run dev",
	"dev:electron:start": "cd app && npm run dev:electron:start",
	"build:client": "cd client && npm run build",
	"build:app": "cd app && npm run build:all"
}
```

### App Package Cross-Package Dependencies

- `dev:client:start`: References `../client && npm run dev`
- `dev:client:build`: References `../client && npm run build`
- `build:client`: References `../client && npm run build`
- `build:demo`: References `../client && npm run build:demo`
- `build:web`: References `../client && npm run build:web`
- `build:all`: Depends on client build first

### Script Flow Analysis

```
Root dev →
  ├── client: npm run dev (Vite dev server)
  └── app: wait-for-client.js → npm run dev:electron (electron-vite dev)

Root build:all →
  ├── client: npm run build (Vite build)
  └── app: npm run build (typecheck + electron-vite build)
```

### Cross-Package File Dependencies

- App templates reference built client files in `out/main/client/`
- App server serves client assets from built output
- Wait-for-client script ensures client is ready before starting Electron

## Target Monorepo Structure (Updated)

```
electron-bg/
├── pkg/                    # Packages directory (shorter name)
│   ├── shared/            # Shared types, utils, constants
│   ├── electron-app/      # Moved from app/
│   └── client/            # Moved from client/
├── docs/
│   └── memories/          # Documentation with YYYY-MM-DD-topic.md structure
│       └── 2025-08/
└── package.json           # Root workspace configuration
```
