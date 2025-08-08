<script lang="ts">
	import { getImageUrl, type ImageInfo } from '../../services';
	import { settings, updateSharedSettings } from '../../stores';

	const {
		images = [],
		selectedImage = '',
		onImageChange,
		isOverride = false,
		overrideValue = null
	} = $props<{
		images: ImageInfo[];
		selectedImage: string;
		onImageChange: (image: string | null) => void;
		isOverride?: boolean;
		overrideValue?: string | null;
	}>();

	const isOverridden = $derived(isOverride && overrideValue !== null);

	// Function to get thumbnail URL
	function getThumbnailUrl(imageName: string) {
		return getImageUrl(imageName, true); // Use thumbnail
	}

	function handleImageClick(imageName: string) {
		if (isOverride && !isOverridden) {
			// When enabling override in local mode, use the current value
			onImageChange(imageName);
		} else {
			onImageChange(imageName);
		}
	}

	function handleOverride() {
		if (!isOverridden) {
			// When enabling override, use the current value
			onImageChange(selectedImage);
		} else {
			// When disabling override, set to null to use shared value
			onImageChange(null);
		}
	}

	function toggleFavorite(imageName: string, event: Event) {
		event.stopPropagation(); // Prevent triggering the image selection
		updateSharedSettings((current) => ({
			favorites: current.favorites.includes(imageName)
				? current.favorites.filter((name: string) => name !== imageName)
				: [...current.favorites, imageName]
		}));
	}

	// Sort images to show favorites first
	const sortedImages = $derived(
		[...images].sort((a, b) => {
			const aIsFavorite = $settings.favorites.includes(a.name);
			const bIsFavorite = $settings.favorites.includes(b.name);
			if (aIsFavorite && !bIsFavorite) return -1;
			if (!aIsFavorite && bIsFavorite) return 1;
			return 0;
		})
	);

	const effectiveImage = $derived(isOverridden ? overrideValue : selectedImage);
</script>

<div class="form-control w-full">
	<div class="mb-2 flex items-center justify-between">
		<!--  <label class="label" for="image-grid">
            <span class="label-text">Background Image</span>
        </label>-->
		{#if isOverride}
			<button
				class="btn btn-xs {isOverridden ? 'btn-primary' : 'btn-ghost'} ml-auto"
				onclick={handleOverride}
			>
				{isOverridden ? 'Clear' : 'Override'}
			</button>
		{/if}
	</div>
	<div
		class="bg-base-200 grid max-h-[280px] grid-cols-3 gap-2 overflow-y-auto rounded-lg bg-opacity-30 p-2"
		class:ghost={isOverride && !isOverridden}
	>
		{#each sortedImages as image}
			<div
				class="thumbnail-container {effectiveImage === image.name ? 'selected' : ''}"
				class:favorite={$settings.favorites.includes(image.name)}
				class:ghost={isOverride && !isOverridden}
				onclick={() => handleImageClick(image.name)}
				onkeydown={(e) => e.key === 'Enter' && handleImageClick(image.name)}
				tabindex="0"
				role="button"
				aria-pressed={effectiveImage === image.name}
				title={image.name}
			>
				<img src={getThumbnailUrl(image.name)} alt={image.name} class="thumbnail" loading="lazy" />
				<button
					class="favorite-button"
					onclick={(e) => toggleFavorite(image.name, e)}
					title={$settings.favorites.includes(image.name)
						? 'Remove from favorites'
						: 'Add to favorites'}
				>
					{#if $settings.favorites.includes(image.name)}
						★
					{:else}
						☆
					{/if}
				</button>
			</div>
		{/each}
	</div>
</div>

<style>
	.thumbnail-container {
		position: relative;
		cursor: pointer;
		border-radius: 4px;
		overflow: hidden;
		/* Firefox has issues with aspect-ratio in grid layouts */
		padding-top: 100%; /* Create a perfect square regardless of content */
		height: 0;
		transition:
			transform 0.2s,
			box-shadow 0.2s;
		background: #333;
	}

	.thumbnail-container:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
	}

	.thumbnail-container.selected {
		outline: 3px solid #0078d7;
		box-shadow: 0 0 10px rgba(0, 120, 215, 0.7);
	}

	.thumbnail-container.ghost {
		opacity: 0.7;
	}

	.thumbnail-container.ghost:hover {
		opacity: 0.9;
	}

	.thumbnail {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: filter 0.2s;
	}

	.thumbnail-container:hover .thumbnail {
		filter: brightness(1.1);
	}

	.favorite-button {
		position: absolute;
		top: 0;
		right: 0;
		padding: 0;
		background: rgba(0, 0, 0, 0);
		border: none;
		border-radius: 50%;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(255, 255, 255, 0.61);
		font-size: 16px;
		cursor: pointer;
		transition: background-color 0.2s;
		outline: none;
		z-index: 1;
	}

	.favorite .favorite-button,
	.favorite-button:hover {
		color: #ffd700;
	}

	.ghost {
		opacity: 0.7;
	}

	.ghost:hover {
		opacity: 0.9;
	}
</style>
