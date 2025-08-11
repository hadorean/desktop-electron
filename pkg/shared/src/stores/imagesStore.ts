/**
 * Reactive store for managing images across the application
 */
import { writable, derived, get } from 'svelte/store'
import { api, type ImageInfo } from '../services'

// Internal store state
interface ImagesStoreState {
	images: ImageInfo[]
	isLoading: boolean
	error: string | null
	lastUpdated: number | null
}

// Initial state
const initialState: ImagesStoreState = {
	images: [],
	isLoading: false,
	error: null,
	lastUpdated: null
}

// Create the main store
const imagesStoreInternal = writable<ImagesStoreState>(initialState)

/**
 * Load images from the API
 */
export async function loadImages(): Promise<void> {
	// Set loading state
	imagesStoreInternal.update((state) => ({
		...state,
		isLoading: true,
		error: null
	}))

	try {
		const images = await api.getImages()

		imagesStoreInternal.update((state) => ({
			...state,
			images,
			isLoading: false,
			error: null,
			lastUpdated: Date.now()
		}))

		console.log(`📷 Loaded ${images.length} images into store`)
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error loading images'

		imagesStoreInternal.update((state) => ({
			...state,
			isLoading: false,
			error: errorMessage
		}))

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
export function clearImages(): void {
	imagesStoreInternal.set(initialState)
}

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

// Derived stores for convenient access
export const images = derived(imagesStoreInternal, ($store) => $store.images)
export const imagesLoading = derived(imagesStoreInternal, ($store) => $store.isLoading)
export const imagesError = derived(imagesStoreInternal, ($store) => $store.error)
export const imagesLastUpdated = derived(imagesStoreInternal, ($store) => $store.lastUpdated)

// Combined derived store for components that need multiple values
export const imagesState = derived(imagesStoreInternal, ($store) => $store)

/**
 * Get current images synchronously (useful for imperative code)
 */
export function getCurrentImages(): ImageInfo[] {
	return get(images)
}

/**
 * Get current loading state synchronously
 */
export function isImagesLoading(): boolean {
	return get(imagesLoading)
}

/**
 * Check if images store is empty
 */
export const hasImages = derived(images, ($images) => $images.length > 0)
