/**
 * Shared service for handling image change events across different app contexts
 * Consolidates socket event handling, deduplication, and validation logic
 */

import { loadImages, onImagesChanged, validateSelectedImages, getIsLoadingImages } from '../stores'
import { socketService } from './socket'

// Type for image updated events (matches socket service signature)
type ImageUpdatedEvent = {
	timestamp: number
	reason: string
	filename?: string
	eventType?: string
}

/**
 * Tracks processed events to prevent duplicates across all contexts
 */
let lastProcessedEventTimestamp = 0

/**
 * Cleanup function for removing listeners
 */
let cleanup: (() => void) | null = null

/**
 * Initialize image change handling for a specific context (client or desktop app)
 * @param context - Context name for logging (e.g., 'Client app', 'Desktop app')
 * @returns Cleanup function to remove listeners
 */
export function initializeImageChangeHandling(context: string): () => void {
	// Clean up any existing listeners
	if (cleanup) {
		cleanup()
	}

	// Setup socket listener for images updated events
	const handleImagesUpdated = async (event: ImageUpdatedEvent): Promise<void> => {
		console.log(`${context}: Received images updated event:`, event)

		// Deduplicate events with the same timestamp
		if (event.timestamp <= lastProcessedEventTimestamp) {
			console.log('🚫 Skipping duplicate event (already processed)')
			return
		}

		lastProcessedEventTimestamp = event.timestamp

		// Refresh for file changes and manual refreshes (like directory changes)
		if (event.reason === 'file_change' || event.reason === 'manual_refresh') {
			console.log(`🔄 Processing unique ${event.reason} event`)
			await loadImages()
		}
	}

	// Setup image change validation (skip during initial loading to prevent cascades)
	const handleImagesChanged = (newImages: Array<{ name: string }>): void => {
		// Only validate if we're not currently loading to prevent validation cascades
		if (!getIsLoadingImages()) {
			const imageNames = newImages.map((img) => img.name)
			validateSelectedImages(imageNames)
		}
	}

	// Register listeners
	socketService.onImagesUpdated(handleImagesUpdated)
	const unsubscribeImagesChanged = onImagesChanged(handleImagesChanged)

	// Create cleanup function
	cleanup = () => {
		// Note: socketService doesn't expose an off method, so we'll rely on component cleanup
		// The socket service handles cleanup when components unmount
		unsubscribeImagesChanged?.()
		cleanup = null
	}

	return cleanup
}

/**
 * Cleanup all image change listeners
 * Call this when the component is destroyed
 */
export function cleanupImageChangeHandling(): void {
	if (cleanup) {
		cleanup()
	}
}

/**
 * Get the last processed event timestamp (for debugging)
 */
export function getLastProcessedEventTimestamp(): number {
	return lastProcessedEventTimestamp
}

/**
 * Reset the processed event timestamp (for testing)
 */
export function resetProcessedEventTimestamp(): void {
	lastProcessedEventTimestamp = 0
}
