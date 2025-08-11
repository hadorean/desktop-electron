<script lang="ts">
	import { getImageUrl } from '../../services'
	import { settings, updateSharedSettings, images, imagesLoading, imagesError } from '../../stores'
	import { Button, Card, CardContent } from '../ui'
	import { cn } from '../../lib/utils'

	const {
		selectedImage = '',
		onImageChange,
		isOverride = false,
		overrideValue = null
	} = $props<{
		selectedImage: string
		onImageChange: (image: string | null) => void
		isOverride?: boolean
		overrideValue?: string | null
	}>()

	const isOverridden = $derived(isOverride && overrideValue !== null)
	const isGhost = $derived(isOverride && !isOverridden)

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

	function handleOverride(): void {
		if (!isOverridden) {
			// When enabling override, use the current value
			onImageChange(selectedImage)
		} else {
			// When disabling override, set to null to use shared value
			onImageChange(null)
		}
	}

	function toggleFavorite(imageName: string, event: Event): void {
		event.stopPropagation() // Prevent triggering the image selection
		updateSharedSettings((current) => ({
			favorites: current.favorites.includes(imageName) ? current.favorites.filter((name: string) => name !== imageName) : [...current.favorites, imageName]
		}))
	}

	// Sort images to show favorites first - use derived to minimize recalculation
	const sortedImages = $derived(
		(() => {
			const imageList = $images
			const favorites = $settings.favorites
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

	const effectiveImage = $derived(isOverridden ? overrideValue : selectedImage)
</script>

<div class="image-grid-container">
	<div class="mb-2 flex items-center justify-between">
		{#if isOverride}
			<Button variant={isOverridden ? 'default' : 'ghost'} size="sm" onclick={handleOverride} class="ml-auto h-8 px-3 text-xs">
				{isOverridden ? 'Clear' : 'Override'}
			</Button>
		{/if}
	</div>

	<Card class={cn('image-grid-card', isGhost && 'ghost-image-grid')}>
		<CardContent class="p-2">
			{#if $imagesLoading}
				<!-- Loading state -->
				<div class="text-muted-foreground flex h-[120px] items-center justify-center text-center">
					<div>
						<div class="mb-2 text-4xl opacity-50">⏳</div>
						<div class="text-sm">Loading images...</div>
					</div>
				</div>
			{:else if $imagesError}
				<!-- Error state -->
				<div class="text-destructive flex h-[120px] items-center justify-center text-center">
					<div>
						<div class="mb-2 text-4xl opacity-50">⚠️</div>
						<div class="text-sm">Failed to load images</div>
						<div class="text-xs opacity-70">{$imagesError}</div>
					</div>
				</div>
			{:else if sortedImages.length === 0}
				<!-- Empty state -->
				<div class="text-muted-foreground flex h-[120px] items-center justify-center text-center">
					<div>
						<div class="mb-2 text-4xl opacity-50">📁</div>
						<div class="text-sm">No images found</div>
						<div class="text-xs opacity-70">Add images to your wallpapers folder</div>
					</div>
				</div>
			{:else}
				<div class="grid max-h-[280px] grid-cols-4 gap-2 overflow-y-auto overflow-x-hidden pr-2">
					{#each sortedImages as image (image.name)}
						<div class="card-container aspect-square p-1">
							<div
								class={cn(
									'image-thumbnail-card hover:scale-102 bg-card text-card-foreground group h-full w-full cursor-pointer rounded-lg border shadow-sm transition-all duration-200 hover:shadow-lg',
									effectiveImage === image.name && 'ring-primary shadow-primary/20 shadow-lg ring-2',
									isGhost && 'ghost-thumbnail'
								)}
								onclick={() => handleImageClick(image.name)}
								onkeydown={(e: KeyboardEvent) => e.key === 'Enter' && handleImageClick(image.name)}
								tabindex="0"
								role="button"
								aria-pressed={effectiveImage === image.name}
								title={image.name}
							>
								<CardContent class="relative aspect-square p-0">
									<img
										src={getThumbnailUrl(image.name)}
										alt={image.name}
										class="h-full w-full rounded-md object-cover transition-all duration-200 group-hover:brightness-110"
										loading="lazy"
										onerror={(e) => {
											const target = e.target as HTMLImageElement
											target.style.display = 'none'
											const fallback = target.nextElementSibling as HTMLElement
											if (fallback) fallback.style.display = 'flex'
										}}
									/>
									<!-- Fallback for missing thumbnails -->
									<div class="bg-muted text-muted-foreground hidden h-full w-full items-center justify-center rounded-md">
										<div class="text-center">
											<div class="mb-1 text-2xl opacity-50">🖼️</div>
											<div class="text-xs">Loading...</div>
										</div>
									</div>
									<button
										class={cn(
											'absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full border-none bg-black/20 text-sm backdrop-blur-sm transition-colors duration-200 hover:bg-black/40',
											$settings.favorites.includes(image.name) ? 'text-yellow-400 opacity-100' : 'text-white opacity-20 hover:opacity-80'
										)}
										onclick={(e: Event) => toggleFavorite(image.name, e)}
										title={$settings.favorites.includes(image.name) ? 'Remove from favorites' : 'Add to favorites'}
									>
										{#if $settings.favorites.includes(image.name)}
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

	.card-container {
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		border-radius: 0.5rem; /* Match card border radius */
	}

	:global(.image-grid-card) {
		background: hsl(var(--card) / 0.3) !important;
		backdrop-filter: blur(10px);
		border: 1px solid hsl(var(--border) / 0.3) !important;
	}

	:global(.image-thumbnail-card) {
		background: hsl(var(--card) / 0.8) !important;
		border: 1px solid hsl(var(--border) / 0.3) !important;
		aspect-ratio: 1;
		overflow: hidden;
	}

	/* Custom subtle scale hover effect */
	:global(.hover\:scale-102:hover) {
		transform: scale(1.02);
	}

	/* Ghost mode styling */
	:global(.ghost-image-grid) {
		opacity: 0.5 !important;
		transition: opacity 0.2s ease;
	}

	:global(.ghost-image-grid:hover) {
		opacity: 0.7 !important;
	}

	:global(.ghost-thumbnail) {
		opacity: 0.6 !important;
		border: 1px solid hsl(var(--border) / 0.5) !important;
		background: transparent !important;
	}

	:global(.ghost-thumbnail:hover) {
		opacity: 0.8 !important;
	}

	/* Scrollbar styling for the grid */
	.image-grid-container :global(.overflow-y-auto)::-webkit-scrollbar {
		width: 6px;
	}

	.image-grid-container :global(.overflow-y-auto)::-webkit-scrollbar-track {
		background: hsl(var(--muted) / 0.3);
		border-radius: 3px;
	}

	.image-grid-container :global(.overflow-y-auto)::-webkit-scrollbar-thumb {
		background: hsl(var(--muted-foreground) / 0.5);
		border-radius: 3px;
	}

	.image-grid-container :global(.overflow-y-auto)::-webkit-scrollbar-thumb:hover {
		background: hsl(var(--muted-foreground) / 0.7);
	}
</style>
