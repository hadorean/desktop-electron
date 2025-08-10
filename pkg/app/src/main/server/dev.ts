import express from 'express'
import { join } from 'path'
import { TemplateManager } from './template'
import { SocketManager } from './sockets'
import { LocalServer } from '.'

export class DevelopmentManager {
  private localServer: LocalServer
  private server: express.Application
  private templateManager: TemplateManager
  private sockets: SocketManager
  public isRapidDev: boolean = false
  public clientDevUrl: string = 'http://localhost:5173'
  public clientAssets: { js: string; css: string } | null = null

  constructor(localServer: LocalServer) {
    this.localServer = localServer
    this.server = localServer.server
    this.templateManager = localServer.template
    this.sockets = localServer.sockets
  }

  /**
   * Sets up all development features
   */
  public async setupDevelopmentFeatures(): Promise<void> {
    // In electron-vite, the main process is built to 'out' even in dev mode
    // Only consider it packaged if it's in app.asar (actual distribution package)
    const isPackaged = __dirname.includes('app.asar')
    const isDev =
      process.env.NODE_ENV === 'development' ||
      (process.env.NODE_ENV !== 'production' && !isPackaged)

    console.log('🔍 Development mode check:')
    console.log('  NODE_ENV:', process.env.NODE_ENV)
    console.log('  __dirname:', __dirname)
    console.log('  isPackaged:', isPackaged)
    console.log('  isDev:', isDev)

    if (isDev) {
      console.log('🔧 Setting up development features...')

      // Check if client dev server is running (rapid development mode)
      await this.detectRapidDevMode()

      this.templateManager.setupHotReload()
      this.setupDevelopmentRoutes()
    } else {
      console.log('📦 Production mode - development features disabled')
    }
  }

  /**
   * Detects if a Vite dev server is running for rapid development
   */
  private async detectRapidDevMode(): Promise<void> {
    // Try multiple common Vite dev server ports
    const possiblePorts = [5173, 5174, 5175, 5176, 5177, 5178, 5179]

    for (const port of possiblePorts) {
      const testUrl = `http://localhost:${port}/app/`
      try {
        const response = await fetch(testUrl)
        if (response.ok) {
          this.isRapidDev = true
          this.clientDevUrl = `http://localhost:${port}`
          console.log(
            `🚀 Rapid development mode detected - using client dev server at ${this.clientDevUrl}`
          )
          return
        }
      } catch {
        // Try next port
      }
    }

    this.isRapidDev = false
    console.log('📦 Using built client assets (rapid dev server not detected)')
  }

  /**
   * Invalidates client assets cache
   */
  public invalidateClientAssets(): void {
    // Force rescan of client assets on next request
    this.clientAssets = null
    console.log('♻️  Client assets cache invalidated')
  }

  /**
   * Sets up development-specific routes
   */
  private setupDevelopmentRoutes(): void {
    // Development info endpoint
    this.server.get('/dev/info', (req, res) => {
      const isPackaged = __dirname.includes('app.asar')
      const clientPath = isPackaged
        ? join(__dirname, 'client')
        : join(__dirname, '../../../client/dist')

      res.json({
        development: true,
        templatePath: this.templateManager.getTemplatesPath(),
        clientAssetsPath: join(clientPath, 'assets'),
        currentAssets: this.clientAssets,
        request: {
          userAgent: req.get('User-Agent'),
          hostname: req.hostname,
          query: req.query,
          path: req.path
        },
        server: {
          port: this.localServer.port,
          isRunning: this.localServer.isServerRunning(),
          uptime: process.uptime()
        }
      })
    })

    // Endpoint to manually clear caches
    this.server.post('/dev/clear-cache', async (_req, res) => {
      await this.templateManager.clearCache()
      this.invalidateClientAssets()
      res.json({
        message: 'All caches cleared',
        timestamp: new Date().toISOString()
      })
    })

    // Endpoint to trigger client rebuild notification
    this.server.post('/dev/client-rebuilt', (_req, res) => {
      this.invalidateClientAssets()
      res.json({
        message: 'Client assets invalidated',
        connectedClients: this.sockets.getConnectedClientsCount()
      })
    })

    console.log('🛠️  Development routes enabled: /dev/info, /dev/clear-cache, /dev/client-rebuilt')
  }

  /**
   * Gets the client path for the current environment
   */
  public getClientPath(): string {
    const isPackaged = __dirname.includes('app.asar')
    return isPackaged
      ? join(__dirname, 'client') // Production: client assets are in out/main/client
      : join(__dirname, '../../../client/dist') // Development: client assets in ../client/dist
  }

  /**
   * Checks if we're in development mode
   */
  public isDevelopmentMode(): boolean {
    const isPackaged = __dirname.includes('app.asar')
    return (
      process.env.NODE_ENV === 'development' ||
      (process.env.NODE_ENV !== 'production' && !isPackaged)
    )
  }
}
