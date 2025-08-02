# Dynamic Client Serving Architecture Plan

## Current vs Dynamic Architecture

### Current (Static)
- Pre-built Svelte app served as static files
- Client-side routing handles all navigation
- Server only provides API endpoints

### Proposed (Dynamic)
- Server-rendered HTML with dynamic data injection
- Svelte hydrates on client-side for interactivity
- Server can inject initial state, configuration, and route-specific data

## Demo vs Full-Feature Architecture Integration

### Client Type Detection
The server can dynamically determine client type and serve appropriate features:

```typescript
enum ClientType {
  ELECTRON_FULL = 'electron',
  WEB_DEMO = 'demo', 
  WEB_FULL = 'web-full' // Future: authenticated web version
}

function detectClientType(req: Request): ClientType {
  const userAgent = req.get('User-Agent') || ''
  const isElectron = userAgent.includes('Electron')
  const isDemoMode = req.query.demo === 'true' || req.hostname !== 'localhost'
  
  if (isElectron) return ClientType.ELECTRON_FULL
  if (isDemoMode) return ClientType.WEB_DEMO
  return ClientType.WEB_FULL
}
```

### Feature Gating Architecture
```typescript
interface FeatureFlags {
  settingsSaving: boolean
  userImageUpload: boolean
  localStoragePersistence: boolean
  fullImageLibrary: boolean
  realtimeSync: boolean
  nativeIntegration: boolean
}

const FEATURE_SETS: Record<ClientType, FeatureFlags> = {
  [ClientType.ELECTRON_FULL]: {
    settingsSaving: true,
    userImageUpload: true, 
    localStoragePersistence: true,
    fullImageLibrary: true,
    realtimeSync: true,
    nativeIntegration: true
  },
  [ClientType.WEB_DEMO]: {
    settingsSaving: false,
    userImageUpload: false,
    localStoragePersistence: false,
    fullImageLibrary: false, // Preset images only
    realtimeSync: true,
    nativeIntegration: false
  }
}
```

## Structural Changes Required

### 1. Multi-Build System

**Enhanced Build Process:**
```json
{
  "scripts": {
    "build:electron": "vite build --mode electron",
    "build:demo": "vite build --mode demo", 
    "build:web": "vite build --mode web",
    "build:all": "npm run build:electron && npm run build:demo && npm run build:web"
  }
}
```

**Build Outputs:**
```
src/client/
├── electron-dist/     # Full-feature build for Electron
├── demo-dist/         # Limited-feature build for web demo  
├── web-dist/          # Future: Full web version
└── src/               # Source code with conditional compilation
```

### 2. Template System Integration

**New Dependencies:**
```json
{
  "ejs": "^3.1.9",
  "@types/ejs": "^3.1.2"
}
```

**File Structure Changes:**
```
src/
├── main/
│   ├── server.ts              # Enhanced with template rendering
│   ├── templates/             # EJS templates
│   │   ├── app.ejs           # Main app template
│   │   ├── partials/
│   │   │   ├── head.ejs      # Dynamic head section
│   │   │   └── scripts.ejs   # Script injection
│   │   └── layouts/
│   │       └── base.ejs      # Base HTML layout
│   └── services/
│       ├── template-service.ts # Template rendering logic
│       └── client-config.ts   # Dynamic config generation
├── client/
│   ├── src/                   # Svelte source (unchanged)
│   ├── dist/                  # Built assets
│   └── templates/             # Template assets
└── shared/
    ├── types.ts               # Shared between server templates and client
    └── config.ts              # Configuration interfaces
```

### 2. Server Changes

**Enhanced Route Handling with Feature Detection:**
```typescript
// Dynamic client serving with feature-specific data
app.get('/app*', async (req, res) => {
  const clientType = detectClientType(req)
  const features = FEATURE_SETS[clientType]
  const routeData = await getRouteSpecificData(req.path, req.query, clientType)
  const config = await generateClientConfig(req, clientType)
  
  // Serve different client builds based on type
  const clientDistPath = getClientDistPath(clientType)
  
  res.render('app', {
    title: routeData.title,
    initialState: routeData.state,
    config: config,
    features: features,
    clientType: clientType,
    monitor: req.query.monitor,
    images: await getImagesList(clientType), // Different image sets
    route: req.path,
    assetsPath: `/app/${clientType}/assets/` // Different asset paths
  })
})

function getClientDistPath(clientType: ClientType): string {
  switch(clientType) {
    case ClientType.ELECTRON_FULL: return 'src/client/electron-dist'
    case ClientType.WEB_DEMO: return 'src/client/demo-dist'
    case ClientType.WEB_FULL: return 'src/client/web-dist'
  }
}

async function getImagesList(clientType: ClientType): Promise<ImageItem[]> {
  if (clientType === ClientType.WEB_DEMO) {
    // Return curated preset images for demo
    return DEMO_PRESET_IMAGES
  }
  // Return full user images for Electron/full web
  return await scanForImages()
}
```

**Template Service:**
```typescript
export class TemplateService {
  async renderApp(route: string, query: any) {
    return {
      title: this.getTitleForRoute(route),
      initialState: await this.getInitialState(route, query),
      config: await this.getClientConfig(),
      preloadedData: await this.getPreloadedData(route)
    }
  }
}
```

### 3. Template Structure

**Main Template (app.ejs):**
```html
<!DOCTYPE html>
<html lang="en" data-theme="night">
<head>
  <%- include('partials/head', { title, route }) %>
</head>
<body>
  <div id="app"></div>
  
  <!-- Inject initial state for client hydration -->
  <script>
    window.__INITIAL_STATE__ = <%- JSON.stringify(initialState) %>;
    window.__CLIENT_CONFIG__ = <%- JSON.stringify(config) %>;
    window.__ROUTE_DATA__ = <%- JSON.stringify({ route, monitor }) %>;
  </script>
  
  <%- include('partials/scripts', { config }) %>
</body>
</html>
```

**Head Partial (partials/head.ejs):**
```html
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title><%= title %></title>

<!-- Dynamic meta tags based on route -->
<% if (route.includes('monitor')) { %>
  <meta name="description" content="Monitor <%= monitor %> - Desktop Background Manager">
<% } %>

<!-- Preload critical resources -->
<% if (preloadImages) { %>
  <% preloadImages.forEach(img => { %>
    <link rel="preload" href="/api/thumbnail?name=<%= encodeURIComponent(img) %>" as="image">
  <% }) %>
<% } %>

<link rel="stylesheet" href="/app/assets/index-BJb3gbpS.css">
```

### 4. Client-Side Changes

**Enhanced Svelte App with Feature Gating:**
```typescript
// src/client/src/main.ts
interface InitialData {
  state: any
  config: any
  features: FeatureFlags
  clientType: ClientType
  route: { route: string, monitor?: string }
}

const initialData: InitialData = (window as any).__INITIAL_STATE__ || {}
const clientConfig = (window as any).__CLIENT_CONFIG__ || {}
const routeData = (window as any).__ROUTE_DATA__ || {}
const features = (window as any).__FEATURES__ || {}

// Feature-aware app initialization
const app = new App({
  target: document.getElementById('app')!,
  props: {
    initialState: initialData.state,
    config: clientConfig,
    features: features,
    clientType: initialData.clientType,
    route: routeData
  }
})
```

**Feature-Gated Components:**
```svelte
<!-- src/client/src/App.svelte -->
<script lang="ts">
  export let features: FeatureFlags
  export let clientType: ClientType
  export let initialState: any
</script>

<main>
  <!-- Always available: Image viewing -->
  <ImageGallery images={initialState.images} />
  
  <!-- Demo mode: Show demo banner -->
  {#if clientType === 'demo'}
    <DemoBanner />
  {/if}
  
  <!-- Feature-gated: Settings panel -->
  {#if features.settingsSaving}
    <SettingsPanel />
  {:else}
    <ReadOnlySettings />
  {/if}
  
  <!-- Feature-gated: Upload functionality -->
  {#if features.userImageUpload}
    <ImageUploader />
  {:else}
    <div class="demo-notice">
      Upload disabled in demo mode
    </div>
  {/if}
  
  <!-- Always available: Real-time sync -->
  {#if features.realtimeSync}
    <RealtimeSync />
  {/if}
</main>
```

### 5. Benefits of Dynamic Serving

1. **SEO Improvements**: Proper meta tags, titles per route
2. **Performance**: Pre-load critical data, reduce API calls
3. **Configuration**: Dynamic client configuration per environment
4. **Route-Specific**: Different data/behavior per route
5. **Security**: Server-side validation before client rendering

### 6. Implementation Phases

**Phase 1: Template Foundation**
- Add EJS to server
- Create basic app template
- Migrate static serving to template rendering

**Phase 2: Dynamic Data Injection**
- Add route-specific data loading
- Implement client config generation
- Add initial state injection

**Phase 3: Performance Optimization**
- Add resource preloading
- Implement route-based code splitting
- Add caching strategies

**Phase 4: Advanced Features**
- Server-side route validation
- Dynamic component loading
- Progressive enhancement

### 7. Deployment Architecture

**Multi-Environment Serving:**
```typescript
const DEPLOYMENT_CONFIG = {
  development: {
    electron: 'http://localhost:5173/', // Vite dev server
    demo: 'http://localhost:8080/app?demo=true',
    web: 'http://localhost:8080/app'
  },
  production: {
    electron: 'file://./dist/index.html', // Local file system
    demo: 'https://yourdomain.com/demo',
    web: 'https://yourdomain.com/app'
  }
}
```

**Routing Strategy:**
```
yourdomain.com/           → Landing page
yourdomain.com/demo       → Web demo (limited features)
yourdomain.com/app        → Full web app (future: auth required)
localhost:8080/app        → Full features (Electron mode)
```

### 8. Configuration Management

**Dynamic Client Config with Feature Awareness:**
```typescript
interface ClientConfig {
  clientType: ClientType
  apiEndpoints: {
    images: string
    thumbnails: string
    settings?: string // Only for full versions
  }
  features: FeatureFlags
  assets: {
    presetImages?: string[] // Demo mode only
    allowedFormats: string[]
  }
  monitor: {
    count: number
    resolution: Array<{width: number, height: number}>
  }
  limits: {
    maxImages?: number // Demo: limited, Full: unlimited
    maxFileSize?: number
  }
}

function generateClientConfig(clientType: ClientType): ClientConfig {
  const baseConfig = {
    clientType,
    apiEndpoints: {
      images: '/api/images',
      thumbnails: '/api/thumbnail'
    },
    features: FEATURE_SETS[clientType]
  }
  
  if (clientType === ClientType.WEB_DEMO) {
    return {
      ...baseConfig,
      assets: {
        presetImages: DEMO_IMAGE_LIST,
        allowedFormats: ['jpg', 'png', 'webp']
      },
      limits: {
        maxImages: 20, // Limited for demo
        maxFileSize: 5 * 1024 * 1024 // 5MB limit
      }
    }
  }
  
  return {
    ...baseConfig,
    apiEndpoints: {
      ...baseConfig.apiEndpoints,
      settings: '/api/settings' // Full version has settings
    },
    limits: {
      maxImages: undefined, // Unlimited
      maxFileSize: 50 * 1024 * 1024 // 50MB limit
    }
  }
}
```

### 9. Demo-Specific Benefits

This architecture provides:

**For Demo Users:**
- ✅ **Fast loading**: Preset images, no heavy scanning
- ✅ **No setup required**: Works immediately in browser  
- ✅ **Safe environment**: No file system access
- ✅ **Showcase features**: Real-time sync, UI preview
- ✅ **Clear limitations**: Users understand what full version offers

**For Full Users (Electron):**
- ✅ **Complete functionality**: All features enabled
- ✅ **Performance optimized**: Pre-loaded user data
- ✅ **Offline capable**: Local file access
- ✅ **Seamless experience**: No feature restrictions

**For Developers:**
- ✅ **Single codebase**: Conditional compilation instead of separate apps
- ✅ **Feature gating**: Easy to enable/disable features per build
- ✅ **Deployment flexibility**: Same server handles all client types
- ✅ **A/B testing ready**: Can easily test different feature combinations

This approach gives you the flexibility to:
- **Serve appropriate features** per client type automatically
- **Optimize performance** with client-specific data loading
- **Maintain single codebase** with feature flags
- **Deploy flexibly** to different environments
- **Handle authentication** server-side (future feature)
- **Provide progressive enhancement** from demo to full

Would you like me to implement this dynamic serving approach with demo/full feature gating?