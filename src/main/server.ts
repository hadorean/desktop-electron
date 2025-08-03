import express from 'express'
import cors from 'cors'
import { join } from 'path'
import { readdir, stat, access } from 'fs/promises'
import { constants } from 'fs'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { ThumbnailService } from './services/thumbnail-service'
import { SettingsService, SettingsUpdateEvent } from './services/settings-service'

export class LocalServer {
  private server: express.Application
  private httpServer: any
  private io: SocketIOServer
  private port: number = 8080
  private isRunning: boolean = false
  private readonly IMAGES_PATH = 'D:\\pictures\\wall'
  private readonly SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif']
  private thumbnailService: ThumbnailService
  private settingsService: SettingsService

  constructor() {
    this.server = express()
    this.httpServer = createServer(this.server)
    this.io = new SocketIOServer(this.httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    })
    this.thumbnailService = new ThumbnailService()
    this.settingsService = new SettingsService()
    this.setupMiddleware()
    this.setupRoutes()
    this.setupSocketIO()
  }

  private async scanForImages(): Promise<string[]> {
    try {
      console.log('Scanning for images in:', this.IMAGES_PATH)
      const allFiles: string[] = []

      // Helper function to recursively scan directories
      const scanDirectory = async (dirPath: string): Promise<void> => {
        const items = await readdir(dirPath, { withFileTypes: true, recursive: false })

        for (const item of items) {
          const fullPath = join(dirPath, item.name)

          if (item.isDirectory()) {
            // Recursively scan subdirectories
            // await scanDirectory(fullPath)
          } else if (item.isFile()) {
            // Check if file has a supported image extension
            const ext = item.name.toLowerCase().substring(item.name.lastIndexOf('.'))
            if (this.SUPPORTED_EXTENSIONS.includes(ext)) {
              // Store relative path from images directory
              const relativePath = fullPath.replace(this.IMAGES_PATH, '').replace(/^[\\\/]/, '')
              allFiles.push(relativePath.replace(/\\/g, '/')) // Normalize path separators
            }
          }
        }
      }

      await scanDirectory(this.IMAGES_PATH)
      return allFiles.sort()
    } catch (error) {
      console.error('Error scanning images directory:', error)
      return []
    }
  }

  private setupMiddleware(): void {
    // Enable CORS for cross-origin requests
    this.server.use(cors())

    // Parse JSON bodies
    this.server.use(express.json())

    // Parse URL-encoded bodies
    this.server.use(express.urlencoded({ extended: true }))

    // Serve static files from the built client (assets, etc.)
    const clientPath = join(__dirname, '../client/dist')
    this.server.use('/app/assets', express.static(join(clientPath, 'assets')))
    this.server.use('/app/vite.svg', express.static(join(clientPath, 'vite.svg')))
    this.server.use('/app/favicon.ico', express.static(join(clientPath, 'favicon.ico')))
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.server.get('/health', (_req, res) => {
      res.json({
        status: 'ok',
        message: 'Electron app server is running',
        timestamp: new Date().toISOString()
      })
    })

    // API endpoint example
    this.server.get('/api/info', (_req, res) => {
      res.json({
        appName: 'Electron App',
        version: '1.0.0',
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime()
      })
    })

    // Images API endpoint
    this.server.get('/api/images', async (_req, res) => {
      try {
        const images = await this.scanForImages()
        res.json({
          images: images.map((imagePath) => ({
            name: imagePath,
            thumbnail: `/api/thumbnail?name=${encodeURIComponent(imagePath)}`
          }))
        })
      } catch (error) {
        console.error('Error fetching images:', error)
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to retrieve images list'
        })
      }
    })

    // Image file endpoint - handle nested paths with query parameter
    this.server.get('/api/image', async (req, res) => {
      try {
        const imageName = decodeURIComponent((req.query.name as string) || '')
        const imagePath = join(this.IMAGES_PATH, imageName)

        // Security check: ensure the path is within the images directory
        if (!imagePath.startsWith(this.IMAGES_PATH)) {
          return res.status(403).json({
            error: 'Forbidden',
            message: 'Access denied to path outside images directory'
          })
        }

        // Check if file exists and is readable
        await access(imagePath, constants.F_OK | constants.R_OK)

        // Determine content type based on file extension
        const ext = imageName.toLowerCase().substring(imageName.lastIndexOf('.'))
        const contentTypeMap: Record<string, string> = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.webp': 'image/webp',
          '.bmp': 'image/bmp',
          '.gif': 'image/gif'
        }

        const contentType = contentTypeMap[ext] || 'application/octet-stream'
        res.setHeader('Content-Type', contentType)
        res.setHeader('Cache-Control', 'public, max-age=3600') // Cache for 1 hour

        // Send the file
        res.sendFile(imagePath)
      } catch (error) {
        console.error('Error serving image:', error)
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          res.status(404).json({
            error: 'Not Found',
            message: 'Image not found'
          })
        } else {
          res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to serve image'
          })
        }
      }
    })

    // Thumbnail endpoint with Sharp-generated thumbnails
    this.server.get('/api/thumbnail', async (req, res) => {
      try {
        const imageName = decodeURIComponent((req.query.name as string) || '')

        if (!imageName) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Missing image name parameter'
          })
        }

        const imagePath = join(this.IMAGES_PATH, imageName)

        // Security check: ensure the path is within the images directory
        if (!imagePath.startsWith(this.IMAGES_PATH)) {
          return res.status(403).json({
            error: 'Forbidden',
            message: 'Access denied to path outside images directory'
          })
        }

        // Check if original image exists
        try {
          await access(imagePath, constants.F_OK | constants.R_OK)
        } catch {
          return res.status(404).json({
            error: 'Not Found',
            message: 'Original image not found'
          })
        }

        // Get thumbnail using the thumbnail service
        const thumbnailPath = await this.thumbnailService.getThumbnailAsync(imageName)

        // Set appropriate headers for thumbnail
        res.setHeader('Content-Type', 'image/jpeg') // Thumbnails are always JPEG
        res.setHeader('Cache-Control', 'public, max-age=86400') // Cache for 24 hours
        res.setHeader('X-Thumbnail-Generated', 'true')

        // Send the thumbnail file
        res.sendFile(thumbnailPath)
      } catch (error) {
        console.error('Error serving thumbnail:', error)
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to generate or serve thumbnail'
        })
      }
    })

    // Debug endpoint for thumbnail service status
    this.server.get('/api/thumbnails/status', (_req, res) => {
      try {
        const status = this.thumbnailService.getQueueStatus()
        res.json({
          ...status,
          message: 'Thumbnail service status'
        })
      } catch (error) {
        console.error('Error getting thumbnail status:', error)
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to get thumbnail service status'
        })
      }
    })

    // Clear thumbnail cache endpoint (for development)
    this.server.post('/api/thumbnails/clear-cache', async (_req, res) => {
      try {
        await this.thumbnailService.clearThumbnailCache()
        res.json({
          message: 'Thumbnail cache cleared successfully'
        })
      } catch (error) {
        console.error('Error clearing thumbnail cache:', error)
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to clear thumbnail cache'
        })
      }
    })

    // Settings API endpoints
    this.server.get('/api/settings', async (_req, res) => {
      try {
        const settings = await this.settingsService.getSettings()
        res.json({
          settings,
          message: 'Settings retrieved successfully'
        })
      } catch (error) {
        console.error('Error getting settings:', error)
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to retrieve settings'
        })
      }
    })

    this.server.post('/api/update-settings', async (req, res) => {
      try {
        const { settings, clientId = 'api-client' } = req.body

        if (!settings || typeof settings !== 'object') {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid settings data provided'
          })
        }

        const updateEvent = await this.settingsService.updateSettings(settings, clientId)
        
        // Broadcast to all connected Socket.IO clients except the sender
        this.io.emit('settings_update', updateEvent)

        res.json({
          message: 'Settings updated successfully',
          settings: updateEvent.settings,
          timestamp: updateEvent.timestamp
        })
      } catch (error) {
        console.error('Error updating settings:', error)
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to update settings'
        })
      }
    })

    // Background routes for each monitor - serve the Svelte client
    this.server.get('/background/:monitorId', (req, res) => {
      const monitorId = parseInt(req.params.monitorId)
      // Redirect to the Svelte client with monitor ID as a query parameter
      res.redirect(`/app/?monitor=${monitorId}`)
    })

    // Custom URL structure for monitors
    this.server.get('/app/hadrien/monitor1', (_req, res) => {
      res.redirect(`/app/?monitor=0`)
    })

    this.server.get('/app/hadrien/monitor2', (_req, res) => {
      res.redirect(`/app/?monitor=1`)
    })

    // Serve the Svelte client at /app - handle SPA routing but exclude assets
    this.server.get('/app', (_req, res) => {
      res.sendFile(join(__dirname, '../../src/client/dist/index.html'))
    })

    // Handle any other /app/* routes (but not /app/assets/*) for client-side routing
    this.server.get(/^\/app\/(?!assets\/).*/, (_req, res) => {
      res.sendFile(join(__dirname, '../../src/client/dist/index.html'))
    })

    // Serve a simple HTML page at root
    this.server.get('/', (_req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Electron App Server</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              min-height: 100vh;
            }
            .container {
              background: rgba(255, 255, 255, 0.1);
              padding: 30px;
              border-radius: 15px;
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.2);
            }
            h1 {
              text-align: center;
              margin-bottom: 30px;
              font-size: 2.5em;
            }
            .status {
              background: rgba(34, 197, 94, 0.2);
              border: 1px solid rgba(34, 197, 94, 0.3);
              padding: 15px;
              border-radius: 10px;
              margin-bottom: 20px;
              text-align: center;
            }
            .endpoints {
              background: rgba(255, 255, 255, 0.1);
              padding: 20px;
              border-radius: 10px;
              margin-bottom: 20px;
            }
            .endpoints h3 {
              margin-top: 0;
            }
            .endpoints ul {
              list-style: none;
              padding: 0;
            }
            .endpoints li {
              margin-bottom: 10px;
            }
            .endpoints a {
              color: #3b82f6;
              text-decoration: none;
              font-weight: 600;
            }
            .endpoints a:hover {
              text-decoration: underline;
            }
            .info {
              background: rgba(255, 255, 255, 0.1);
              padding: 20px;
              border-radius: 10px;
            }
            .info h3 {
              margin-top: 0;
            }
            .info p {
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🚀 Electron App Server</h1>
            
            <div class="status">
              <strong>✅ Server is running successfully!</strong>
            </div>
            
                         <div class="endpoints">
               <h3>📡 Available Endpoints:</h3>
               <ul>
                 <li><a href="/health" target="_blank">Health Check</a> - Check server status</li>
                 <li><a href="/api/info" target="_blank">App Info</a> - Get application information</li>
                 <li><a href="/api/images" target="_blank">Images List</a> - Get list of available images</li>
                 <li>Image File - GET /api/image?name={name} - Serve individual image files</li>
                 <li>Thumbnail - GET /api/thumbnail?name={name} - Serve Sharp-generated thumbnails</li>
                 <li><a href="/api/thumbnails/status" target="_blank">Thumbnail Status</a> - Get thumbnail service status</li>
                 <li>Clear Cache - POST /api/thumbnails/clear-cache - Clear thumbnail cache</li>
               </ul>
             </div>
            
            <div class="info">
              <h3>ℹ️ Server Information:</h3>
              <p><strong>URL:</strong> http://localhost:${this.port}</p>
              <p><strong>Status:</strong> Active</p>
              <p><strong>Platform:</strong> ${process.platform}</p>
              <p><strong>Architecture:</strong> ${process.arch}</p>
            </div>
          </div>
        </body>
        </html>
      `)
    })

    // Handle all other routes
    this.server.use((_req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found on this server.',
        availableEndpoints: [
          '/health',
          '/api/info',
          '/api/images',
          '/api/image?name={name}',
          '/api/thumbnail?name={name}',
          '/api/thumbnails/status',
          'POST /api/thumbnails/clear-cache'
        ]
      })
    })
  }

  private setupSocketIO(): void {
    this.io.on('connection', async (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`)

      // Send current settings to newly connected client
      try {
        const settings = await this.settingsService.getSettings()
        socket.emit('settings_update', {
          type: 'settings_update',
          settings,
          timestamp: Date.now(),
          clientId: 'server'
        })
      } catch (error) {
        console.error('Error sending settings to new client:', error)
      }

      // Handle settings updates from clients
      socket.on('update_settings', async (data) => {
        try {
          const { settings, clientId = socket.id } = data
          const updateEvent = await this.settingsService.updateSettings(settings, clientId)
          
          // Broadcast to all other clients
          socket.broadcast.emit('settings_update', updateEvent)
          
          // Acknowledge to sender
          socket.emit('settings_updated', {
            success: true,
            settings: updateEvent.settings,
            timestamp: updateEvent.timestamp
          })
        } catch (error) {
          console.error('Error handling socket settings update:', error)
          socket.emit('settings_updated', {
            success: false,
            error: 'Failed to update settings'
          })
        }
      })

      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`)
      })
    })
  }

  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isRunning) {
        resolve()
        return
      }

      const server = this.httpServer.listen(this.port, () => {
        this.isRunning = true
        console.log(`🚀 Local server running at http://localhost:${this.port}`)
        console.log(`🔌 Socket.IO enabled for real-time communication`)

        // Start background thumbnail generation
        this.startBackgroundThumbnailGeneration()

        resolve()
      })

      server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          console.log(`⚠️  Port ${this.port} is in use, trying ${this.port + 1}`)
          this.port++
          this.start().then(resolve).catch(reject)
        } else {
          reject(error)
        }
      })
    })
  }

  private async startBackgroundThumbnailGeneration(): Promise<void> {
    try {
      console.log('📸 Starting background thumbnail generation...')
      const images = await this.scanForImages()
      await this.thumbnailService.generateAllThumbnailsInBackground(images)
    } catch (error) {
      console.error('Error starting background thumbnail generation:', error)
    }
  }

  public stop(): void {
    if (this.isRunning) {
      // Note: In a real implementation, you'd want to properly close the server
      // This is a simplified version
      this.isRunning = false
      console.log('🛑 Local server stopped')
    }
  }

  public getUrl(): string {
    return `http://localhost:${this.port}`
  }

  public isServerRunning(): boolean {
    return this.isRunning
  }
}
