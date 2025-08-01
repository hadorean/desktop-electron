import express from 'express'
import cors from 'cors'
import { join } from 'path'

export class LocalServer {
  private server: express.Application
  private port: number = 8080
  private isRunning: boolean = false

  constructor() {
    this.server = express()
    this.setupMiddleware()
    this.setupRoutes()
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

    // Serve the Svelte client at /app
    this.server.get('/app', (_req, res) => {
      res.sendFile(join(__dirname, '../client/dist/index.html'))
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
        availableEndpoints: ['/health', '/api/info']
      })
    })
  }

  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isRunning) {
        resolve()
        return
      }

      const server = this.server.listen(this.port, () => {
        this.isRunning = true
        console.log(`🚀 Local server running at http://localhost:${this.port}`)
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
