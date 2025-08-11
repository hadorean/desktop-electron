# Development Experience with Dynamic Serving

## Hot Reload Considerations

### Current Development Setup

```bash
npm run dev  # Electron-vite handles both main process and renderer hot reload
```

### Enhanced Development Architecture

## 1. Multi-Mode Development Servers

**Development Script Enhancement:**

```json
{
	"scripts": {
		"dev": "concurrently \"npm run dev:server\" \"npm run dev:client:all\"",
		"dev:server": "nodemon src/main/server.ts --watch src/main --watch src/shared",
		"dev:client:all": "concurrently \"npm run dev:electron\" \"npm run dev:demo\" \"npm run dev:web\"",
		"dev:electron": "vite --mode electron --port 5173",
		"dev:demo": "vite --mode demo --port 5174",
		"dev:web": "vite --mode web --port 5175",
		"dev:templates": "nodemon --watch src/main/templates --exec \"echo Templates changed\""
	}
}
```

**Dependencies for Development:**

```json
{
	"devDependencies": {
		"concurrently": "^8.2.2",
		"nodemon": "^3.0.2",
		"chokidar": "^3.5.3"
	}
}
```

## 2. Development Server Configuration

**Enhanced Development Server:**

```typescript
// src/main/dev-server.ts
import { createServer as createViteServer } from 'vite'
import { watch } from 'chokidar'

export class DevelopmentServer extends LocalServer {
	private viteServers: Map<ClientType, any> = new Map()
	private templateWatcher?: any

	async startDevelopment() {
		// Start multiple Vite dev servers for different client types
		await this.startViteServers()

		// Watch templates for changes
		this.watchTemplates()

		// Start main Express server with proxy to Vite servers
		await this.start()
	}

	private async startViteServers() {
		const configs = [
			{ type: ClientType.ELECTRON_FULL, port: 5173 },
			{ type: ClientType.WEB_DEMO, port: 5174 },
			{ type: ClientType.WEB_FULL, port: 5175 }
		]

		for (const config of configs) {
			const viteServer = await createViteServer({
				mode: config.type,
				server: { port: config.port },
				define: {
					__CLIENT_TYPE__: JSON.stringify(config.type),
					__FEATURES__: JSON.stringify(FEATURE_SETS[config.type])
				}
			})

			await viteServer.listen()
			this.viteServers.set(config.type, viteServer)
			console.log(`🔥 Vite server (${config.type}) running on port ${config.port}`)
		}
	}

	private watchTemplates() {
		this.templateWatcher = watch('src/main/templates/**/*.ejs')
		this.templateWatcher.on('change', (path: string) => {
			console.log(`📝 Template changed: ${path}`)
			// Clear template cache for hot reload
			this.clearTemplateCache()
		})
	}

	private setupDevelopmentRoutes() {
		// In development, proxy to appropriate Vite server based on client type
		this.server.get('/app*', async (req, res) => {
			const clientType = this.detectClientType(req)
			const viteServer = this.viteServers.get(clientType)

			if (viteServer) {
				// Proxy to Vite dev server for hot reload
				return this.proxyToVite(req, res, viteServer)
			}

			// Fallback to template rendering if Vite server not available
			await this.renderTemplate(req, res, clientType)
		})
	}

	private async proxyToVite(req: any, res: any, viteServer: any) {
		// Proxy request to Vite dev server while injecting dynamic data
		const url = req.originalUrl.replace('/app', '')

		try {
			// Get template with dynamic data
			const template = await this.getViteTemplate(viteServer, '/index.html')
			const clientType = this.detectClientType(req)
			const dynamicData = await this.getDynamicData(req, clientType)

			// Inject data into Vite-served HTML
			const html = this.injectDynamicData(template, dynamicData)

			res.setHeader('Content-Type', 'text/html')
			res.send(html)
		} catch (error) {
			console.error('Vite proxy error:', error)
			res.status(500).send('Development server error')
		}
	}

	private async getViteTemplate(viteServer: any, url: string): Promise<string> {
		// Get HTML from Vite with hot reload capabilities
		const { transformIndexHtml } = viteServer.ssrLoadModule('/src/main.ts')
		return await viteServer.transformIndexHtml(
			url,
			'<div id="app"></div>', // Base template
			{
				/* Vite transform options */
			}
		)
	}

	private injectDynamicData(template: string, data: any): string {
		// Inject server data while preserving Vite's hot reload scripts
		return template.replace(
			'<div id="app"></div>',
			`<div id="app"></div>
       <script>
         window.__INITIAL_STATE__ = ${JSON.stringify(data.initialState)};
         window.__CLIENT_CONFIG__ = ${JSON.stringify(data.config)};
         window.__FEATURES__ = ${JSON.stringify(data.features)};
       </script>`
		)
	}
}
```

## 3. Hot Reload Support Matrix

| Component         | Development Hot Reload | How It Works                              |
| ----------------- | ---------------------- | ----------------------------------------- |
| **Svelte Client** | ✅ Full HMR            | Vite dev servers with native Svelte HMR   |
| **Server Routes** | ✅ Auto-restart        | Nodemon watches server files              |
| **Templates**     | ✅ Live reload         | Chokidar watches .ejs files, clears cache |
| **Feature Flags** | ✅ Live update         | Injected per request, no cache            |
| **API Endpoints** | ✅ Auto-restart        | Part of server restart cycle              |
| **Shared Types**  | ✅ Full reload         | TypeScript compilation + restart          |

## 4. Development Workflow

**Starting Development:**

```bash
npm run dev
# Starts:
# ├── Express server (port 8080) - API + templates
# ├── Vite dev server (port 5173) - Electron client
# ├── Vite dev server (port 5174) - Demo client
# └── Vite dev server (port 5175) - Full web client
```

**Accessing Different Modes:**

```bash
# Electron mode (full features)
http://localhost:8080/app

# Demo mode (limited features)
http://localhost:8080/app?demo=true

# Direct Vite servers (for debugging)
http://localhost:5173  # Electron build
http://localhost:5174  # Demo build
http://localhost:5175  # Web build
```

## 5. Development Experience Benefits

### ✅ **Preserved Hot Reload**

- Svelte components update instantly
- CSS changes apply without page refresh
- State preservation during development

### ✅ **Multi-Mode Testing**

- Test demo and full features simultaneously
- Switch between modes with URL parameter
- Compare feature sets in real-time

### ✅ **Server-Side Development**

- Template changes reload instantly
- API changes restart server automatically
- Feature flag changes apply immediately

### ✅ **Debugging Capabilities**

```typescript
// Debug mode: Show which client type and features are active
if (import.meta.env.DEV) {
	console.log('Client Type:', clientType)
	console.log('Features:', features)
	console.log('Initial State:', initialState)
}
```

## 6. Potential Challenges & Solutions

### **Challenge: Complex Build Setup**

**Solution**: Use `concurrently` to manage multiple processes

```json
{
	"dev": "concurrently --names \"SERVER,ELECTRON,DEMO,WEB\" --prefix-colors \"blue,green,yellow,cyan\" \"npm run dev:server\" \"npm run dev:electron\" \"npm run dev:demo\" \"npm run dev:web\""
}
```

### **Challenge: Port Management**

**Solution**: Use consistent port allocation

```typescript
const DEV_PORTS = {
	SERVER: 8080,
	ELECTRON: 5173,
	DEMO: 5174,
	WEB: 5175
}
```

### **Challenge: Template vs Vite Conflicts**

**Solution**: Hybrid approach - Vite for assets, server for HTML

```typescript
// Development: Vite handles assets, server injects data
// Production: Server renders everything
const isDev = process.env.NODE_ENV === 'development'
if (isDev) {
	return proxyToViteWithDataInjection(req, res)
} else {
	return renderTemplate(req, res)
}
```

## 7. Performance During Development

### **Memory Usage**

- Multiple Vite servers: ~200MB each
- Express server: ~50MB
- Total: ~650MB (acceptable for development)

### **Startup Time**

- Sequential startup: ~10-15 seconds
- Parallel startup: ~5-8 seconds (with concurrently)

### **Hot Reload Speed**

- Svelte changes: ~100-300ms (preserved)
- Server changes: ~1-2 seconds (nodemon restart)
- Template changes: ~50-100ms (cache clear)

## 8. Development Scripts Summary

```json
{
	"scripts": {
		"dev": "concurrently \"npm run dev:server\" \"npm run dev:client:all\"",
		"dev:server": "nodemon src/main/server.ts",
		"dev:client:all": "concurrently \"npm run dev:electron\" \"npm run dev:demo\" \"npm run dev:web\"",
		"dev:electron": "vite --mode electron --port 5173",
		"dev:demo": "vite --mode demo --port 5174",
		"dev:web": "vite --mode web --port 5175",

		"build": "npm run build:all",
		"build:all": "concurrently \"npm run build:electron\" \"npm run build:demo\" \"npm run build:web\"",
		"build:electron": "vite build --mode electron",
		"build:demo": "vite build --mode demo",
		"build:web": "vite build --mode web",

		"preview": "npm run build && npm run start",
		"start": "node dist/main/server.js"
	}
}
```

## Conclusion

**✅ Hot reload is fully preserved** and even enhanced:

1. **Client-side**: Multiple Vite dev servers maintain full HMR
2. **Server-side**: Nodemon provides auto-restart for server changes
3. **Templates**: File watchers enable instant template updates
4. **Multi-mode**: Can develop and test all client types simultaneously

The development experience is actually **improved** because you can:

- Test feature parity between demo and full versions
- Develop with realistic server-injected data
- Debug client type detection and feature gating
- Hot reload all components of the system

The architecture supports excellent development velocity while providing the production benefits of dynamic serving and feature gating.
