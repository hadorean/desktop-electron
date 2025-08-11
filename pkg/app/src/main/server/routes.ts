import { join } from 'path'
import { constants } from 'fs'
import { access } from 'fs/promises'
import { type LocalServer } from '.'
import { thumbnailService } from '../services/thumbnails'
import { settingsService } from '../services/settings'
import { imageService } from '../services/images'
import { scanForClientAssets } from './assets'
import { SocketEvents } from '@heyketsu/shared/types/sockets'
import { ApiRoutes } from '@heyketsu/shared/types/api'

export function registerRoutes(localServer: LocalServer): void {
	const server = localServer.server

	// Health check endpoint
	server.get(ApiRoutes.Health, (_req, res) => {
		res.json({
			status: 'ok',
			message: 'Electron app server is running',
			timestamp: new Date().toISOString()
		})
	})

	// API endpoint example
	server.get(ApiRoutes.Info, (_req, res) => {
		res.json({
			appName: 'Electron App',
			version: '1.0.0',
			platform: process.platform,
			arch: process.arch,
			uptime: process.uptime()
		})
	})

	// Images API endpoint
	server.get(ApiRoutes.Images, async (_req, res) => {
		try {
			const images = await imageService.scanForImages()
			res.json({
				images: images.map((imagePath: string) => ({
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
	server.get(ApiRoutes.Image, async (req, res) => {
		try {
			const imageName = decodeURIComponent((req.query.name as string) || '')
			const imagePath = join(imageService.getImagesPath(), imageName)

			// Security check: ensure the path is within the images directory
			if (!imagePath.startsWith(imageService.getImagesPath())) {
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
			res.setHeader('Cache-Control', 'public, max-age=3600')

			return res.sendFile(imagePath)
		} catch (error) {
			console.error('Error serving image:', error)
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				return res.status(404).json({
					error: 'Not Found',
					message: 'Image not found'
				})
			} else {
				return res.status(500).json({
					error: 'Internal Server Error',
					message: 'Failed to serve image'
				})
			}
		}
	})

	// Thumbnail endpoint
	server.get(ApiRoutes.Thumbnail, async (req, res) => {
		try {
			const imageName = decodeURIComponent((req.query.name as string) || '')

			if (!imageName) {
				return res.status(400).json({
					error: 'Bad Request',
					message: 'Missing image name parameter'
				})
			}

			const imagePath = join(imageService.getImagesPath(), imageName)

			// Security check
			if (!imagePath.startsWith(imageService.getImagesPath())) {
				return res.status(403).json({
					error: 'Forbidden',
					message: 'Access denied to path outside images directory'
				})
			}

			try {
				await access(imagePath, constants.F_OK | constants.R_OK)
			} catch {
				return res.status(404).json({
					error: 'Not Found',
					message: 'Original image not found'
				})
			}

			const thumbnailPath = await thumbnailService.getThumbnailAsync(imageName)

			res.setHeader('Content-Type', 'image/jpeg')
			res.setHeader('Cache-Control', 'public, max-age=86400')
			res.setHeader('X-Thumbnail-Generated', 'true')

			return res.sendFile(thumbnailPath)
		} catch (error) {
			console.error('Error serving thumbnail:', error)
			return res.status(500).json({
				error: 'Internal Server Error',
				message: 'Failed to generate or serve thumbnail'
			})
		}
	})

	// Debug endpoint for thumbnail service status
	server.get(ApiRoutes.ThumbnailsStatus, (_req, res) => {
		try {
			const status = thumbnailService.getQueueStatus()
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

	// Clear thumbnail cache endpoint
	server.post(ApiRoutes.ThumbnailsClearCache, async (_req, res) => {
		try {
			await thumbnailService.clearThumbnailCache()
			res.json({ message: 'Thumbnail cache cleared successfully' })
		} catch (error) {
			console.error('Error clearing thumbnail cache:', error)
			res.status(500).json({ error: 'Internal Server Error', message: 'Failed to clear thumbnail cache' })
		}
	})

	// Settings API endpoints
	server.get(ApiRoutes.Settings, async (_req, res) => {
		try {
			const settings = await settingsService.getSettings()
			res.json({ settings, message: 'Settings retrieved successfully' })
		} catch (error) {
			console.error('Error getting settings:', error)
			res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve settings' })
		}
	})

	server.post(ApiRoutes.UpdateSettings, async (req, res) => {
		try {
			const { settings, clientId = 'api-client' } = req.body

			if (!settings || typeof settings !== 'object') {
				return res.status(400).json({ error: 'Bad Request', message: 'Invalid settings data provided' })
			}

			const updateEvent = await settingsService.updateSettings(settings, clientId)
			localServer.emit(SocketEvents.SettingsUpdate, updateEvent)

			return res.json({
				message: 'Settings updated successfully',
				settings: updateEvent.settings,
				timestamp: updateEvent.timestamp
			})
		} catch (error) {
			console.error('Error updating settings:', error)
			return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update settings' })
		}
	})

	// Background routes for each monitor
	server.get(`${ApiRoutes.Background}/:monitorId`, (req, res) => {
		const monitorId = parseInt(req.params.monitorId)
		res.redirect(`/app/monitor${monitorId + 1}`)
	})

	// Serve the Svelte client using correct path format: /app/:userId/:screenId
	server.get(ApiRoutes.AppDynamic, async (req, res) => {
		const { screenId } = req.params

		let assets
		if (localServer.isRapidDev) {
			assets = { js: `${localServer.clientDevUrl}/app/src/main.ts`, css: null }
		} else {
			if (!localServer.clientAssets) {
				localServer.clientAssets = await scanForClientAssets()
			}
			assets = localServer.clientAssets
		}

		const data = {
			title: 'Hey ketsu',
			timestamp: new Date().toISOString(),
			route: req.path,
			query: req.query,
			screenId,
			userAgent: req.get('User-Agent') || 'unknown',
			serverUrl: `http://localhost:${localServer.port}`,
			assets,
			isRapidDev: localServer.isRapidDev,
			clientDevUrl: localServer.clientDevUrl
		}

		res.render('app', data)
	})

	// Fallback route for /app
	server.get(ApiRoutes.App, (_req, res) => {
		res.redirect('/app/monitor1')
	})

	// Legacy static route for fallback
	server.get(ApiRoutes.AppStatic, (_req, res) => {
		const isPackaged = __dirname.includes('app.asar')
		const clientPath = isPackaged ? join(__dirname, 'client') : join(__dirname, '../../../client/dist')
		res.sendFile(join(clientPath, 'index.html'))
	})

	// Handle any other /app/* routes (but not /app/assets/*)
	server.get(/^\/app\/(?!assets\/).*/, (_req, res) => {
		const isPackaged = __dirname.includes('app.asar')
		const clientPath = isPackaged ? join(__dirname, 'client') : join(__dirname, '../../../client/dist')
		res.sendFile(join(clientPath, 'index.html'))
	})

	// Serve a simple HTML page at root
	server.get('/', (_req, res) => {
		res.send(`...server-root-html...`)
	})

	// Handle all other routes
	server.use((_req, res) => {
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
