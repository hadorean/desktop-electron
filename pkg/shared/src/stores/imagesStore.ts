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
export const images = derived(imagesStoreInternal, ($store) => $store.images)
export const imagesLoading = derived(imagesStoreInternal, ($store) => $store.isLoading)
export const imagesError = derived(imagesStoreInternal, ($store) => $store.error)
export const imagesLastUpdated = derived(imagesStoreInternal, ($store) => $store.lastUpdated)
export const hasImages = derived(images, ($images) => $images.length > 0)

// Combined derived store for components that need multiple values
export const imagesState = derived(imagesStoreInternal, ($store) => $store)

/**
 * Load images from the API
 */
export async function loadImages(): Promise<void> {
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
		const previousImages = getCurrentImages()

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
		notifyImageChangeCallbacks(images, previousImages)
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
}

/**
 * Force refresh images (bypasses any caching)
 */
export async function refreshImages(): Promise<void> {
	console.log('📷 Force refreshing images')
	await loadImages()
}

/**
 * Clear the store (useful for cleanup)
 */
export const clearImages = (): void => imagesStoreInternal.set(initialState)

/**
 * Update images directly (for use by socket events in Phase 3)
 */
export function updateImages(newImages: ImageInfo[]): void {
	imagesStoreInternal.update((state) => ({
		...state,
		images: newImages,
		lastUpdated: Date.now()
	}))
	console.log(`📷 Updated store with ${newImages.length} images via direct update`)
}

export const getCurrentImages = () => get(images)
export const isImagesLoading = () => get(imagesLoading)

/**
 * Register a callback to be notified when images change
 */
export function onImagesChanged(callback: ImageChangeCallback): () => void {
	imageChangeCallbacks.push(callback)

	// Return unsubscribe function
	return () => {
		const index = imageChangeCallbacks.indexOf(callback)
		if (index > -1) {
			imageChangeCallbacks.splice(index, 1)
		}
	}
}

/**
 * Notify all registered callbacks about image changes
 */
function notifyImageChangeCallbacks(newImages: ImageInfo[], previousImages: ImageInfo[]): void {
	imageChangeCallbacks.forEach((callback) => {
		try {
			callback(newImages, previousImages)
		} catch (error) {
			console.error('📷 Error in image change callback:', error)
		}
	})
}

/**
 * Get fallback image name (first available image or empty string)
 */
export function getFallbackImageName(): string {
	const currentImages = getCurrentImages()
	return currentImages.length > 0 ? currentImages[0].name : ''
}

/**
 * Check if an image name exists in the current images list
 */
export function imageExists(imageName: string): boolean {
	if (!imageName) return false
	return getCurrentImages().some((img) => img.name === imageName)
}

/**
 * Check if we're currently loading images (to prevent validation cascades)
 */
export const getIsLoadingImages = () => isLoadingImages
