<script lang="ts">
	import { getImageUrl } from '../../services'
	import { imagesStore, settingsStore } from '../../stores'
	import { Card, CardContent, Icon } from '../ui'

	const {
		selectedImage = '',
		onImageChange,
		isOverride = false,
		overrideValue = null,
		defaultImage = ''
	} = $props<{
		selectedImage: string
		onImageChange: (image: string | null) => void
		isOverride?: boolean
		overrideValue?: string | null
		defaultImage?: string
	}>()

	const isOverridden = $derived(isOverride && overrideValue !== null)
	const isGhost = $derived(isOverride && !isOverridden)
	const effectiveImage = $derived(isOverridden ? overrideValue : selectedImage)
	const canRevert = $derived(isOverridden && effectiveImage !== defaultImage)

	// Function to get thumbnail URL
	function getThumbnailUrl(imageName: string): string {
		return getImageUrl(imageName, true) // Use thumbnail
	}

	function handleImageClick(imageName: string): void {
		if (isOverride && !isOverridden) {
			// When enabling override in local mode, use the current value
			onImageChange(imageName)
		} else {
			onImageChange(imageName)
		}
	}

	function handleRevert(): void {
		if (!canRevert) return

		// Turn off the override to use shared value
		onImageChange(null)
	}

	function toggleFavorite(imageName: string, event: Event): void {
		event.stopPropagation() // Prevent triggering the image selection
		settingsStore.updateSharedSettings(current => {
			const currentFavorites = current.favorites ?? []
			return {
				favorites: currentFavorites.includes(imageName) ? currentFavorites.filter((name: string) => name !== imageName) : [...currentFavorites, imageName]
			}
		})
	}

	// Sort images to show favorites first - use derived to minimize recalculation
	// Access individual stores from the imagesStore object
	const { images, imagesLoading, imagesError } = imagesStore
	const { screenSettings } = settingsStore

	const sortedImages = $derived(
		(() => {
			const imageList = $images
			const favorites = $screenSettings.favorites ?? []
			if (imageList.length === 0) return []

			return [...imageList].sort((a, b) => {
				const aIsFavorite = favorites.includes(a.name)
				const bIsFavorite = favorites.includes(b.name)
				if (aIsFavorite && !bIsFavorite) return -1
				if (!aIsFavorite && bIsFavorite) return 1
				return 0
			})
		})()
	)
</script>

{#snippet message(icon: string, message: string, detail?: string, isError?: boolean)}
	<div class="state-container {isError ? 'error' : ''}">
		<div class="state-content">
			<div class="state-icon">{icon}</div>
			<div class="state-message">{message}</div>
			{#if detail}
				<div class="state-detail">{detail}</div>
			{/if}
		</div>
	</div>
{/snippet}

<div class="image-grid-container no-drag">
	<div class="header-section drag">
		<h3 class="section-title drag">Background image</h3>
		{#if isOverride && canRevert}
			<button class="revert-button" onclick={handleRevert} title="Clear override" aria-label="Clear override">
				<Icon name="revert" size="sm" />
			</button>
		{/if}
	</div>

	<Card class="image-grid-card no-drag {isGhost ? 'ghost-image-grid' : ''}">
		<CardContent class="grid-card-content no-drag">
			{#if $imagesLoading}
				{@render message('⏳', 'Loading images...')}
			{:else if $imagesError}
				{@render message('⚠️', 'Failed to load images', $imagesError, true)}
			{:else if sortedImages.length === 0}
				{@render message('📁', 'No images found', 'Add images to your wallpapers folder')}
			{:else}
				<div class="image-grid no-drag">
					{#each sortedImages as image (image.name)}
						<div class="card-container">
							<div
								class="image-thumbnail-card group {effectiveImage === image.name ? 'selected' : ''} {isGhost ? 'ghost-thumbnail' : ''}"
								onclick={() => handleImageClick(image.name)}
								onkeydown={(e: KeyboardEvent) => e.key === 'Enter' && handleImageClick(image.name)}
								tabindex="0"
								role="button"
								aria-pressed={effectiveImage === image.name}
								title={image.name}
							>
								<CardContent class="thumbnail-content">
									<img
										src={getThumbnailUrl(image.name)}
										alt={image.name}
										class="thumbnail-image"
										loading="lazy"
										onerror={e => {
											const target = e.target as HTMLImageElement
											target.style.display = 'none'
											const fallback = target.nextElementSibling as HTMLElement
											if (fallback) fallback.style.display = 'flex'
										}}
									/>
									<!-- Fallback for missing thumbnails -->
									<div class="image-fallback">
										<div class="fallback-content">
											<div class="fallback-icon">🖼️</div>
											<div class="fallback-text">Loading...</div>
										</div>
									</div>
									<button
										class="favorite-button {($screenSettings.favorites ?? []).includes(image.name) ? 'is-favorite' : ''}"
										onclick={(e: Event) => toggleFavorite(image.name, e)}
										title={($screenSettings.favorites ?? []).includes(image.name) ? 'Remove from favorites' : 'Add to favorites'}
									>
										{#if ($screenSettings.favorites ?? []).includes(image.name)}
											★
										{:else}
											☆
										{/if}
									</button>
								</CardContent>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</CardContent>
	</Card>
</div>

<style>
	.image-grid-container {
		width: 100%;
	}

	.header-section {
		margin-bottom: 0.5rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.section-title {
		font-size: 1.1rem;
		font-weight: 500;
		color: var(--text-primary);
		margin: 0 0 0.5rem 0;
		flex: 1;
	}

	.revert-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border: none;
		border-radius: 0.25rem;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.revert-button:hover {
		background: var(--surface-hover);
		color: var(--text-primary);
		transform: scale(1.1);
	}

	:global(.grid-card-content) {
		padding: 0.5rem !important;
	}

	.image-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 0.5rem;
		max-height: 280px;
		overflow-y: auto;
		overflow-x: hidden;
		padding-right: 0.5rem;
	}

	.card-container {
		aspect-ratio: 1;
		padding: 0.25rem;
	}

	.image-thumbnail-card {
		height: 100%;
		width: 100%;
		cursor: pointer;
		border-radius: var(--radius-lg);
		background-color: var(--card);
		border: 1px solid transparent;
		box-shadow: var(--shadow-sm);
		transition: all 0.2s ease;
		overflow: hidden;
		position: relative;
	}

	.image-thumbnail-card:hover {
		transform: scale(1.02);
		box-shadow: var(--shadow-lg);
	}

	.image-thumbnail-card.selected {
		box-shadow:
			var(--shadow-lg),
			0 0 0 2px var(--primary);
	}

	:global(.thumbnail-content) {
		position: relative;
		aspect-ratio: 1;
		padding: 0 !important;
		height: 100%;
		overflow: hidden;
	}

	.thumbnail-image {
		height: 100%;
		width: 100%;
		border-radius: calc(var(--radius-lg) - 1px);
		object-fit: cover;
		transition: all 0.2s ease;
	}

	.group:hover .thumbnail-image {
		filter: brightness(1.1);
	}

	.image-fallback {
		background-color: var(--surface-hover);
		color: var(--text-muted);
		display: none;
		height: 100%;
		width: 100%;
		align-items: center;
		justify-content: center;
		border-radius: calc(var(--radius-lg) - 1px);
	}

	.fallback-content {
		text-align: center;
	}

	.fallback-icon {
		margin-bottom: 0.25rem;
		font-size: 1.5rem;
		opacity: 0.5;
	}

	.fallback-text {
		font-size: 0.75rem;
	}

	.favorite-button {
		position: absolute;
		right: 0.25rem;
		top: 0.25rem;
		display: flex;
		height: 1.5rem;
		width: 1.5rem;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		border: none;
		background-color: rgba(0, 0, 0, 0.2);
		color: white;
		font-size: 0.875rem;
		backdrop-filter: blur(4px);
		transition: all 0.2s ease;
		opacity: 0.2;
		cursor: pointer;
	}

	.favorite-button:hover {
		background-color: rgba(0, 0, 0, 0.4);
		opacity: 0.8;
	}

	.favorite-button.is-favorite {
		color: #fbbf24;
		opacity: 1;
	}

	:global(.image-grid-card) {
		background: rgba(0, 0, 0, 0.2) !important;
		/* backdrop-filter: blur(10px); */
		border: 1px solid hsl(var(--border) / 0.3) !important;
	}

	.image-thumbnail-card {
		background: hsl(var(--card) / 0.8) !important;
		border: 1px solid hsl(var(--border) / 0.3) !important;
	}

	/* Scale hover effect is now handled by .image-thumbnail-card:hover */

	/* Ghost mode styling */
	:global(.ghost-image-grid) {
		opacity: 0.5 !important;
		transition: opacity 0.2s ease;
	}

	:global(.ghost-image-grid:hover) {
		opacity: 0.7 !important;
	}

	.ghost-thumbnail {
		opacity: 0.6 !important;
		border: 1px solid hsl(var(--border) / 0.5) !important;
		background: transparent !important;
	}

	.ghost-thumbnail:hover {
		opacity: 0.8 !important;
	}

	/* Message styling */

	.state-container {
		color: var(--text-muted);
		display: flex;
		height: 120px;
		align-items: center;
		justify-content: center;
		text-align: center;
	}

	.state-container.error {
		color: var(--danger);
	}

	.state-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.state-icon {
		margin-bottom: 0.5rem;
		font-size: 2.25rem;
		opacity: 0.5;
	}

	.state-message {
		font-size: 0.875rem;
	}

	.state-detail {
		font-size: 0.75rem;
		opacity: 0.7;
	}
</style>
