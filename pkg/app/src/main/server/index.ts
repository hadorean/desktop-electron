import { userOptionsStore } from '$shared/stores/userOptionsStore'
import cors from 'cors'
import express from 'express'
import { createServer } from 'http'
import { join } from 'path'
import { imageService } from '../services/images'
import { thumbnailService } from '../services/thumbnails'
import { setLocalServer } from '../stores/appStore'
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
	private unsubscribeOptionsWatcher: (() => void) | null = null

	constructor() {
		this.server = express()
		this.httpServer = createServer(this.server)
		this.sockets = new SocketManager(this.httpServer)
		this.template = new TemplateManager(this.server)
		this.dev = new DevelopmentManager(this)
		this.setupMiddleware()
		registerRoutes(this)
		this.setupImageWatcher()
		this.setupPortWatcher()
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
		imageService.onImagesChanged(data => {
			console.log(`📷 Images changed: ${data.eventType} - ${data.filename}`)
			// Broadcast to all connected clients
			this.sockets.broadcastImagesUpdated('file_change', data.filename, data.eventType)
		})
	}

	public stop(): Promise<void> {
		return new Promise(resolve => {
			if (this.isRunning) {
				this.template.stop()
				this.sockets.close()

				this.httpServer.close(() => {
					this.isRunning = false
					console.log('🛑 Local server stopped')
					resolve()
				})
			} else {
				resolve()
			}
		})
	}

	public getUrl(): string {
		return `http://localhost:${this.port}`
	}

	public getAppUrl(): string {
		return `http://localhost:${this.port}/app/browser`
	}

	public isServerRunning(): boolean {
		return this.isRunning
	}

	public emit<T>(event: string, data: T): void {
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

	public updatePort(newPort: number): void {
		this.port = newPort
		console.log(`🔧 Port updated to ${newPort}`)
	}

	public async restart(): Promise<void> {
		console.log('🔄 Restarting local server...')
		await this.stop()
		await this.start()
		// Notify observers that server has restarted
		setLocalServer(this)
		console.log('✅ Local server restarted successfully')
	}

	private setupPortWatcher(): void {
		// Watch for port changes in user options
		this.unsubscribeOptionsWatcher = userOptionsStore.onChanged((newOptions, previousOptions) => {
			if (newOptions.port !== previousOptions.port) {
				console.log(`🔧 Port change detected: ${previousOptions.port} → ${newOptions.port}`)
				this.updatePort(newOptions.port)
				this.restart().catch(error => {
					console.error('Failed to restart server after port change:', error)
				})
			}
		})
	}

	public destroy(): void {
		// Clean up watchers
		if (this.unsubscribeOptionsWatcher) {
			this.unsubscribeOptionsWatcher()
			this.unsubscribeOptionsWatcher = null
		}
	}
}

export const initLocalServer = async (): Promise<void> => {
	const localServer = new LocalServer()
	try {
		await localServer.start()
		setLocalServer(localServer)
	} catch (error) {
		console.error('Failed to start local server:', error)
	}
}
