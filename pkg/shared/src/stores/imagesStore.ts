/**
 * Reactive store for managing images across the application
 */
import { derived, get, writable } from 'svelte/store'
import type { ImageInfo } from '../types'

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

const initialState: ImagesStoreState = {
	images: [],
	isLoading: false,
	error: null,
	lastUpdated: null
}

const state = writable<ImagesStoreState>(initialState)
const images = derived(state, $store => $store.images)
const loading = derived(state, $store => $store.isLoading)

// Single export object containing all properties and functions
export const imagesStore = {
	// Reactive stores
	images: derived(images, x => x),
	loading: derived(loading, x => x),
	error: derived(state, $store => $store.error),
	lastUpdated: derived(state, $store => $store.lastUpdated),
	hasImages: derived(images, $images => $images.length > 0),

	// Functions defined directly in the object
	async loadImages(images: ImageInfo[]): Promise<void> {
		// Prevent validation cascades during loading
		isLoadingImages = true

		// Set loading state
		state.update(state => ({
			...state,
			isLoading: true,
			error: null
		}))

		try {
			const previousImages = this.getCurrentImages()

			state.update(state => ({
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

			state.update(state => ({
				...state,
				isLoading: false,
				error: errorMessage
			}))

			// Reset loading flag on error too
			isLoadingImages = false

			console.error('📷 Error loading images:', error)
		}
	},

	clearImages(): void {
		state.set(initialState)
	},

	updateImages(newImages: ImageInfo[]): void {
		state.update(state => ({
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
		return get(loading)
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
		return this.getCurrentImages().some(img => img.name === imageName)
	},

	getIsLoadingImages() {
		return isLoadingImages
	},

	// Private helper method
	notifyImageChangeCallbacks(newImages: ImageInfo[], previousImages: ImageInfo[]): void {
		imageChangeCallbacks.forEach(callback => {
			try {
				callback(newImages, previousImages)
			} catch (error) {
				console.error('📷 Error in image change callback:', error)
			}
		})
	}
}
