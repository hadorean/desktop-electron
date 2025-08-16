import { userOptionsStore } from '$shared/stores/userOptionsStore'
import { EventEmitter } from 'events'
import { watch } from 'fs'
import { readdir } from 'fs/promises'
import { join } from 'path'

export class ImageService extends EventEmitter {
	private imagesPathValue: string
	private readonly SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif']
	private watcher: ReturnType<typeof watch> | null = null
	private watcherInitialized = false
	private cachedImages: string[] = []
	private lastScanTime = 0
	private debounceTimer: NodeJS.Timeout | null = null
	private readonly DEBOUNCE_DELAY = 2000 // ms to wait for additional events
	private userOptionsUnsubscribe: (() => void) | null = null

	constructor() {
		super()

		// Initialize with current image directory from store
		this.imagesPathValue = userOptionsStore.getCurrentImageDirectory()

		// Subscribe to image directory changes
		this.userOptionsUnsubscribe = userOptionsStore.onChanged((newOptions, previousOptions) => {
			if (newOptions.imageDirectory !== previousOptions.imageDirectory) {
				console.log('🔧 ImageService: Image directory changed from', previousOptions.imageDirectory, 'to', newOptions.imageDirectory)
				this.setImagesPath(newOptions.imageDirectory)
			}
		})

		console.log('🔧 ImageService: Initialized with directory:', this.imagesPathValue)
	}

	/**
	 * Gets the images directory path
	 */
	public get imagesPath(): string {
		return this.imagesPathValue
	}

	/**
	 * Sets the images directory path and restarts the watcher if it's already running
	 */
	public setImagesPath(path: string): void {
		if (this.imagesPathValue !== path) {
			this.imagesPathValue = path
			if (this.watcherInitialized) {
				this.stopWatcher()
				this.startWatcher()
			}
		}
	}

	/**
	 * Scans the images directory for supported image files
	 * @returns Array of relative image paths
	 */
	public async scanForImages(): Promise<string[]> {
		// Start watcher on first call
		if (!this.watcherInitialized) {
			this.startWatcher()
		}

		// Return cached results if available and recent (within 1 second)
		const now = Date.now()
		if (this.cachedImages.length > 0 && now - this.lastScanTime < 1000) {
			return [...this.cachedImages]
		}

		try {
			console.log('Scanning for images in:', this.imagesPathValue)
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
							const relativePath = fullPath.replace(this.imagesPathValue, '').replace(/^[\\/]/, '')
							allFiles.push(relativePath.replace(/\\/g, '/')) // Normalize path separators
						}
					}
				}
			}

			await scanDirectory(this.imagesPathValue)
			this.cachedImages = allFiles.sort()
			this.lastScanTime = now
			return [...this.cachedImages]
		} catch (error) {
			console.error('Error scanning images directory:', error)
			return []
		}
	}

	/**
	 * Starts the file watcher for the images directory
	 */
	private startWatcher(): void {
		if (this.watcher) {
			this.stopWatcher()
		}

		try {
			console.log('Starting file watcher for:', this.imagesPathValue)
			this.watcher = watch(this.imagesPathValue, { recursive: true }, (eventType, filename) => {
				if (filename) {
					console.log(`File watcher event: ${eventType} - ${filename}`)

					// Clear cache to force rescan on next call
					this.cachedImages = []
					this.lastScanTime = 0

					// Debounce: clear existing timer and set new one
					if (this.debounceTimer) {
						clearTimeout(this.debounceTimer)
					}

					this.debounceTimer = setTimeout(() => {
						console.log('📷 File changes settled, emitting imagesChanged event')
						// Emit single event after debounce period
						this.emit('imagesChanged', {
							eventType: 'batch_change',
							filename: 'multiple',
							timestamp: Date.now()
						})
						this.debounceTimer = null
					}, this.DEBOUNCE_DELAY)
				}
			})
			this.watcherInitialized = true
		} catch (error) {
			console.error('Error starting file watcher:', error)
			this.watcherInitialized = false
		}
	}

	/**
	 * Stops the file watcher
	 */
	private stopWatcher(): void {
		// Clear any pending debounce timer
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer)
			this.debounceTimer = null
		}

		if (this.watcher) {
			try {
				this.watcher.close()
				console.log('File watcher stopped')
			} catch (error) {
				console.error('Error stopping file watcher:', error)
			}
			this.watcher = null
		}
		this.watcherInitialized = false
	}

	/**
	 * Gets the list of supported image extensions
	 */
	public getSupportedExtensions(): string[] {
		return [...this.SUPPORTED_EXTENSIONS]
	}

	/**
	 * Gets the images directory path (deprecated, use imagesPath getter)
	 */
	public getImagesPath(): string {
		return this.imagesPathValue
	}

	/**
	 * Add listener for images changed events
	 */
	public onImagesChanged(callback: (data: { eventType: string; filename: string; timestamp: number }) => void): void {
		this.on('imagesChanged', callback)
	}

	/**
	 * Remove listener for images changed events
	 */
	public offImagesChanged(callback: (data: { eventType: string; filename: string; timestamp: number }) => void): void {
		this.off('imagesChanged', callback)
	}

	/**
	 * Cleanup method to stop the watcher when the service is no longer needed
	 */
	public dispose(): void {
		// Clear any pending debounce timer
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer)
			this.debounceTimer = null
		}

		// Unsubscribe from user options changes
		if (this.userOptionsUnsubscribe) {
			this.userOptionsUnsubscribe()
			this.userOptionsUnsubscribe = null
		}

		this.stopWatcher()
		this.removeAllListeners()
		console.log('🔧 ImageService: Disposed')
	}
}

// Export singleton instance
export const imageService = new ImageService()
