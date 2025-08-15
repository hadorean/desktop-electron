/**
 * Reactive store for managing images across the application
 */
import { derived, get, writable } from 'svelte/store'
import { api, type ImageInfo } from '../services'

// Internal store state
interface ImagesStoreState {
	images: ImageInfo[]
	isLoading: boolean
	error: string | null
	lastUpdated: number | null
}

// Callback type for image change notifications
type ImageChangeCallback = (newImages: ImageInfo[], previousImages: ImageInfo[]) => void

// Array to store callbacks
const imageChangeCallbacks: ImageChangeCallback[] = []

// Flag to prevent validation cascades during loading
let isLoadingImages = false

// Initial state
const initialState: ImagesStoreState = {
	images: [],
	isLoading: false,
	error: null,
	lastUpdated: null
}

// Create the main store
const imagesStoreInternal = writable<ImagesStoreState>(initialState)

// Derived stores for convenient access
const images = derived(imagesStoreInternal, ($store) => $store.images)
const imagesLoading = derived(imagesStoreInternal, ($store) => $store.isLoading)
const imagesError = derived(imagesStoreInternal, ($store) => $store.error)
const imagesLastUpdated = derived(imagesStoreInternal, ($store) => $store.lastUpdated)
const hasImages = derived(images, ($images) => $images.length > 0)

// Combined derived store for components that need multiple values
const imagesState = derived(imagesStoreInternal, ($store) => $store)

// Single export object containing all properties and functions
export const imagesStore = {
	// Reactive stores
	images,
	imagesLoading,
	imagesError,
	imagesLastUpdated,
	hasImages,
	imagesState,

	// Functions defined directly in the object
	async loadImages(): Promise<void> {
		// Prevent validation cascades during loading
		isLoadingImages = true

		// Set loading state
		imagesStoreInternal.update((state) => ({
			...state,
			isLoading: true,
			error: null
		}))

		try {
			const images = await api.getImages()
			const previousImages = this.getCurrentImages()

			imagesStoreInternal.update((state) => ({
				...state,
				images,
				isLoading: false,
				error: null,
				lastUpdated: Date.now()
			}))

			console.log(`📷 Loaded ${images.length} images into store`)

			// Reset loading flag before notifying callbacks
			isLoadingImages = false

			// Notify callbacks of image changes
			this.notifyImageChangeCallbacks(images, previousImages)
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error loading images'

			imagesStoreInternal.update((state) => ({
				...state,
				isLoading: false,
				error: errorMessage
			}))

			// Reset loading flag on error too
			isLoadingImages = false

			console.error('📷 Error loading images:', error)
		}
	},

	async refreshImages(): Promise<void> {
		console.log('📷 Force refreshing images')
		await this.loadImages()
	},

	clearImages(): void {
		imagesStoreInternal.set(initialState)
	},

	updateImages(newImages: ImageInfo[]): void {
		imagesStoreInternal.update((state) => ({
			...state,
			images: newImages,
			lastUpdated: Date.now()
		}))
		console.log(`📷 Updated store with ${newImages.length} images via direct update`)
	},

	getCurrentImages() {
		return get(images)
	},

	isImagesLoading() {
		return get(imagesLoading)
	},

	onImagesChanged(callback: ImageChangeCallback): () => void {
		imageChangeCallbacks.push(callback)

		// Return unsubscribe function
		return () => {
			const index = imageChangeCallbacks.indexOf(callback)
			if (index > -1) {
				imageChangeCallbacks.splice(index, 1)
			}
		}
	},

	getFallbackImageName(): string {
		const currentImages = this.getCurrentImages()
		return currentImages.length > 0 ? currentImages[0].name : ''
	},

	imageExists(imageName: string): boolean {
		if (!imageName) return false
		return this.getCurrentImages().some((img) => img.name === imageName)
	},

	getIsLoadingImages() {
		return isLoadingImages
	},

	// Private helper method
	notifyImageChangeCallbacks(newImages: ImageInfo[], previousImages: ImageInfo[]): void {
		imageChangeCallbacks.forEach((callback) => {
			try {
				callback(newImages, previousImages)
			} catch (error) {
				console.error('📷 Error in image change callback:', error)
			}
		})
	}
}
