import { ServerEventMap, ServerEvents } from '$shared/types/sockets'
import cors from 'cors'
import express from 'express'
import { createServer } from 'http'
import { join } from 'path'
import { imageService } from '../services/images'
import { thumbnailService } from '../services/thumbnails'
import { DevelopmentManager } from './dev'
import { registerRoutes } from './routes'
import { SocketManager } from './sockets'
import { TemplateManager } from './template'

export class LocalServer {
	public server: express.Application
	private httpServer: ReturnType<typeof createServer>
	public sockets: SocketManager
	public template: TemplateManager
	private dev: DevelopmentManager
	public port: number = 8080
	private isRunning: boolean = false

	constructor() {
		this.server = express()
		this.httpServer = createServer(this.server)
		this.sockets = new SocketManager(this.httpServer)
		this.template = new TemplateManager(this.server)
		this.dev = new DevelopmentManager(this)
		this.setupMiddleware()
		registerRoutes(this)
		this.setupImageWatcher()
	}

	private setupMiddleware(): void {
		// Enable CORS for cross-origin requests
		this.server.use(cors())

		// Parse JSON bodies
		this.server.use(express.json())

		// Parse URL-encoded bodies
		this.server.use(express.urlencoded({ extended: true }))

		// Serve static files from the built client (client/dist)
		// This serves the separate client app, not the Electron renderer
		const clientPath = this.dev.getClientPath()

		this.server.use('/app/assets', express.static(join(clientPath, 'assets')))
		this.server.use('/app/vite.svg', express.static(join(clientPath, 'vite.svg')))
		this.server.use('/app/favicon.ico', express.static(join(clientPath, 'favicon.ico')))
		console.log('📁 Client assets path:', join(clientPath, 'assets'))
		console.log('📁 Is packaged (middleware):', this.dev.isDevelopmentMode() ? false : true)
	}

	// routes are registered in server/routes.ts

	public async start(): Promise<void> {
		if (this.isRunning) {
			return
		}

		// Setup development features before starting server
		await this.dev.setupDevelopmentFeatures()

		return new Promise((resolve, reject) => {
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
			const images = await imageService.scanForImages()
			await thumbnailService.startBackgroundThumbnailGeneration(images)
		} catch (error) {
			console.error('Error starting background thumbnail generation:', error)
		}
	}

	private setupImageWatcher(): void {
		// Listen for file changes from the image service
		imageService.onImagesChanged((data) => {
			console.log(`📷 Images changed: ${data.eventType} - ${data.filename}`)
			// Broadcast to all connected clients
			this.sockets.broadcastImagesUpdated('file_change', data.filename, data.eventType)
		})
	}

	public stop(): void {
		if (this.isRunning) {
			this.template.stop()
			this.sockets.close()

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

	public emit<T extends ServerEvents>(event: T, data: ServerEventMap[T]): void {
		this.sockets.emit(event, data)
	}

	// Development-related getters
	public get isRapidDev(): boolean {
		return this.dev.isRapidDev
	}

	public get clientDevUrl(): string {
		return this.dev.clientDevUrl
	}

	public get clientAssets(): { js: string; css: string } | null {
		return this.dev.clientAssets
	}

	public set clientAssets(assets: { js: string; css: string } | null) {
		this.dev.clientAssets = assets
	}
}
