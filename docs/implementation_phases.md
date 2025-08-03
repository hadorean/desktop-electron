# Implementation Phases for Dynamic Serving

## Phase 1: Basic Dynamic Serving (1-2 hours)

### Step 1.1: Add Template Engine
```bash
npm install ejs @types/ejs
```

### Step 1.2: Basic Template Structure
```typescript
// src/main/server.ts
import express from 'express'
import { join } from 'path'

export class LocalServer {
  private setupTemplateEngine(): void {
    // Set EJS as template engine
    this.server.set('view engine', 'ejs')
    this.server.set('views', join(__dirname, 'templates'))
  }
  
  private setupRoutes(): void {
    // ... existing routes ...
    
    // Replace static /app route with template rendering
    this.server.get('/app*', async (req, res) => {
      const data = {
        title: 'Electron App',
        initialState: {
          images: await this.scanForImages(),
          route: req.path,
          query: req.query
        }
      }
      
      res.render('app', data)
    })
  }
}
```

### Step 1.3: Create Basic Template
```html
<!-- src/main/templates/app.ejs -->
<!DOCTYPE html>
<html lang="en" data-theme="night">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title><%= title %></title>
  <link rel="stylesheet" href="/app/assets/index-BJb3gbpS.css">
</head>
<body>
  <div id="app"></div>
  
  <script>
    window.__INITIAL_STATE__ = <%- JSON.stringify(initialState) %>;
  </script>
  
  <script type="module" src="/app/assets/index-C-fQ0O9-.js"></script>
</body>
</html>
```

### Step 1.4: Test Basic Dynamic Serving
- Start server: `npm run dev`
- Visit: `http://localhost:8080/app`
- Verify: Template renders with injected data

**✅ Milestone**: Basic template rendering works, can inject server data

### ✅ COMPLETED - Additional Phase 1 Enhancements

#### Dynamic Asset Management
- **Added dynamic asset scanning** - Server automatically detects current asset filenames (`index-*.js`, `index-*.css`)
- **Enhanced template rendering** - Assets injected as template variables instead of hardcoded paths
- **Build-resilient** - Works even when Vite generates new asset hashes

```typescript
// Implemented in src/main/server.ts
private async scanForClientAssets(): Promise<{ js: string; css: string }> {
  // Automatically finds current asset files in src/client/dist/assets
}

// Template data now includes dynamic assets
const data = {
  // ... other data
  assets: this.clientAssets // { js: 'index-BKpD4odt.js', css: 'index-CV3mCCdu.css' }
}
```

```html
<!-- Updated src/main/templates/app.ejs -->
<script type="module" crossorigin src="/app/assets/<%= assets.js %>"></script>
<link rel="stylesheet" crossorigin href="/app/assets/<%= assets.css %>">
```

#### Socket.IO Integration Fixes
- **Fixed port detection** - Socket.IO now uses server-provided URL instead of hardcoded fallback
- **Delayed initialization** - Socket service waits for server data injection
- **Automatic reconnection** - Socket reinitializes when server URL changes
- **Fallback port updated** - Changed from 8081 to 8080 to match server default

#### Enhanced Route Handling
- **Path parameters** - Proper `/app/:userId/:screenId` format support
- **Server data injection** - Includes `serverUrl`, `userId`, `screenId`, `timestamp`, `route`, `query`, `userAgent`
- **Background window compatibility** - Works with Electron's multi-monitor setup

**Current Status**: Phase 1 complete with production-ready dynamic serving foundation

---

## Phase 2: Feature Detection & Gating (2-3 hours)

### Step 2.1: Add Client Type Detection
```typescript
// src/shared/types.ts
export enum ClientType {
  ELECTRON_FULL = 'electron',
  WEB_DEMO = 'demo',
  WEB_FULL = 'web'
}

export interface FeatureFlags {
  settingsSaving: boolean
  userImageUpload: boolean
  localStoragePersistence: boolean
  fullImageLibrary: boolean
  realtimeSync: boolean
}

// src/main/services/client-detection.ts
export function detectClientType(req: express.Request): ClientType {
  const userAgent = req.get('User-Agent') || ''
  const isElectron = userAgent.includes('Electron')
  const isDemoMode = req.query.demo === 'true' || req.hostname !== 'localhost'
  
  if (isElectron) return ClientType.ELECTRON_FULL
  if (isDemoMode) return ClientType.WEB_DEMO
  return ClientType.WEB_FULL
}

export const FEATURE_SETS: Record<ClientType, FeatureFlags> = {
  [ClientType.ELECTRON_FULL]: {
    settingsSaving: true,
    userImageUpload: true,
    localStoragePersistence: true,
    fullImageLibrary: true,
    realtimeSync: true
  },
  [ClientType.WEB_DEMO]: {
    settingsSaving: false,
    userImageUpload: false,
    localStoragePersistence: false,
    fullImageLibrary: false,
    realtimeSync: true
  },
  [ClientType.WEB_FULL]: {
    settingsSaving: true,
    userImageUpload: false, // Future: enable for authenticated users
    localStoragePersistence: true,
    fullImageLibrary: true,
    realtimeSync: true
  }
}
```

### Step 2.2: Enhanced Route Handling
```typescript
// src/main/server.ts
import { detectClientType, FEATURE_SETS } from './services/client-detection'

private setupRoutes(): void {
  // ... existing routes ...
  
  this.server.get('/app*', async (req, res) => {
    const clientType = detectClientType(req)
    const features = FEATURE_SETS[clientType]
    
    const data = {
      title: this.getTitleForClient(clientType),
      clientType,
      features,
      initialState: {
        images: await this.getImagesForClient(clientType),
        route: req.path,
        query: req.query
      }
    }
    
    res.render('app', data)
  })
}

private getTitleForClient(clientType: ClientType): string {
  switch(clientType) {
    case ClientType.WEB_DEMO: return 'Desktop Background Manager - Demo'
    case ClientType.ELECTRON_FULL: return 'Desktop Background Manager'
    case ClientType.WEB_FULL: return 'Desktop Background Manager - Web'
  }
}

private async getImagesForClient(clientType: ClientType): Promise<any[]> {
  if (clientType === ClientType.WEB_DEMO) {
    // Return curated demo images
    return this.getDemoImages()
  }
  // Return full user images
  return await this.scanForImages()
}

private getDemoImages(): any[] {
  // Curated subset of images for demo
  const demoImageNames = [
    'aishot-1261.jpg',
    'aishot-1316.jpg', 
    'Tolkein-Tolkien-Map-of-Middle-Earth-5160.png',
    'wallpaper.jpg'
  ]
  
  return demoImageNames.map(name => ({
    name,
    thumbnail: `/api/thumbnail?name=${encodeURIComponent(name)}`
  }))
}
```

### Step 2.3: Enhanced Template with Feature Gating
```html
<!-- src/main/templates/app.ejs -->
<!DOCTYPE html>
<html lang="en" data-theme="night">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title><%= title %></title>
  
  <% if (clientType === 'demo') { %>
    <meta name="description" content="Try our desktop background manager - demo version with limited features">
  <% } else { %>
    <meta name="description" content="Desktop background manager - full featured application">
  <% } %>
  
  <link rel="stylesheet" href="/app/assets/index-BJb3gbpS.css">
</head>
<body>
  <div id="app"></div>
  
  <script>
    window.__INITIAL_STATE__ = <%- JSON.stringify(initialState) %>;
    window.__CLIENT_CONFIG__ = <%- JSON.stringify({ clientType, features }) %>;
  </script>
  
  <script type="module" src="/app/assets/index-C-fQ0O9-.js"></script>
</body>
</html>
```

### Step 2.4: Client-Side Feature Gating
```typescript
// src/client/src/main.ts
const initialState = (window as any).__INITIAL_STATE__ || {}
const clientConfig = (window as any).__CLIENT_CONFIG__ || {}

const app = new App({
  target: document.getElementById('app')!,
  props: {
    initialState,
    features: clientConfig.features,
    clientType: clientConfig.clientType
  }
})
```

```svelte
<!-- src/client/src/App.svelte -->
<script lang="ts">
  export let features: FeatureFlags
  export let clientType: string
  export let initialState: any
</script>

<main>
  {#if clientType === 'demo'}
    <div class="demo-banner">
      🚀 Demo Mode - <a href="/download">Get full version</a>
    </div>
  {/if}
  
  <ImageGallery images={initialState.images} />
  
  {#if features.settingsSaving}
    <SettingsPanel />
  {:else}
    <div class="demo-notice">Settings are read-only in demo mode</div>
  {/if}
  
  {#if features.userImageUpload}
    <ImageUploader />
  {/if}
</main>
```

### Step 2.5: Test Feature Gating
- Test demo: `http://localhost:8080/app?demo=true`
- Test full: `http://localhost:8080/app`
- Verify different features are enabled/disabled

**✅ Milestone**: Feature detection and gating works for demo vs full

---

## Phase 3: Enhanced Development Experience (2-4 hours)

### Step 3.1: Add Development Dependencies
```bash
npm install --save-dev concurrently nodemon chokidar
```

### Step 3.2: Enhanced Development Scripts
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "nodemon src/main/server.ts --watch src/main --watch src/shared",
    "dev:client": "electron-vite dev",
    "dev:templates": "nodemon --watch src/main/templates --exec \"echo Templates changed\"",
    
    "build": "npm run typecheck && electron-vite build",
    "build:demo": "vite build --mode demo --outDir src/client/demo-dist",
    "build:web": "vite build --mode web --outDir src/client/web-dist"
  }
}
```

### Step 3.3: Development Server Enhancements
```typescript
// src/main/dev-server.ts
import { watch } from 'chokidar'

export class DevelopmentServer extends LocalServer {
  private templateWatcher?: any

  constructor() {
    super()
    if (process.env.NODE_ENV === 'development') {
      this.setupDevelopmentFeatures()
    }
  }

  private setupDevelopmentFeatures(): void {
    // Watch templates for changes
    this.templateWatcher = watch('src/main/templates/**/*.ejs')
    this.templateWatcher.on('change', (path: string) => {
      console.log(`📝 Template changed: ${path}`)
      // Clear require cache for templates
      delete require.cache[require.resolve(path)]
    })

    // Add development-specific routes
    this.setupDevelopmentRoutes()
  }

  private setupDevelopmentRoutes(): void {
    // Development info endpoint
    this.server.get('/dev/info', (req, res) => {
      const clientType = detectClientType(req)
      const features = FEATURE_SETS[clientType]
      
      res.json({
        clientType,
        features,
        request: {
          userAgent: req.get('User-Agent'),
          hostname: req.hostname,
          query: req.query
        }
      })
    })
  }
}
```

### Step 3.4: Template Hot Reload
```typescript
// src/main/server.ts
private clearTemplateCache(): void {
  if (process.env.NODE_ENV === 'development') {
    // Clear EJS template cache
    const ejs = require('ejs')
    ejs.clearCache()
  }
}
```

**✅ Milestone**: Development experience enhanced with hot reload

---

## Implementation Benefits by Phase

### After Phase 1:
- ✅ Server can inject initial data
- ✅ Template-based rendering works
- ✅ Foundation for feature gating

### After Phase 2:
- ✅ Demo vs full feature detection
- ✅ Different experiences per client type
- ✅ Business value: demo functionality

### After Phase 3:
- ✅ Optimal development workflow
- ✅ Hot reload for all components
- ✅ Multi-mode development support

## Risk Management

**Low Risk Start**: Phase 1 can be easily reverted to static serving
**Incremental Value**: Each phase provides immediate benefits
**Development Continuity**: Current workflow preserved until Phase 3

This phased approach ensures you can:
1. **Start small** and validate the approach
2. **Get business value** early (demo functionality)
3. **Enhance gradually** without disrupting current workflow