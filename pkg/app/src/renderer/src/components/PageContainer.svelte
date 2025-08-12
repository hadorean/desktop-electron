<script lang="ts">
	import type { Snippet } from 'svelte'
	import { Carousel, CarouselContent, CarouselItem } from '$shared/components/ui'

	interface Props {
		settingsContent?: Snippet<[{ currentPage: number; goToOptions: () => void; goToSettings: () => void }]>
		optionsContent?: Snippet<[{ currentPage: number; goToOptions: () => void; goToSettings: () => void }]>
		transparent?: boolean
		class?: string
	}

	let { settingsContent, optionsContent, class: className = '', ...restProps }: Props = $props()

	// Page navigation state
	let currentPage = $state(0) // 0 = settings, 1 = options
	let carousel: HTMLDivElement

	// Navigation functions
	export function goToSettings(): void {
		handlePageChange(0)
	}

	export function goToOptions(): void {
		handlePageChange(1)
	}

	export function getCurrentPage(): number {
		return currentPage
	}

	// Fade animation state
	let isTransitioning = $state(false)

	function handlePageChange(newIndex: number): void {
		if (newIndex === currentPage) return

		isTransitioning = true
		currentPage = newIndex // Update immediately for button visibility

		// Start fade out
		setTimeout(() => {
			// Fade back in
			setTimeout(() => {
				isTransitioning = false
			}, 150)
		}, 150)
	}
</script>

<div class="page-container {className}" class:transitioning={isTransitioning} {...restProps}>
	<Carousel bind:this={carousel} class="carousel-full" currentIndex={currentPage} onIndexChange={handlePageChange}>
		<CarouselContent currentIndex={currentPage}>
			<!-- Settings Page -->
			<CarouselItem>
				{@render settingsContent?.({ currentPage, goToOptions, goToSettings })}
			</CarouselItem>

			<!-- Options Page -->
			<CarouselItem>
				{@render optionsContent?.({ currentPage, goToOptions, goToSettings })}
			</CarouselItem>
		</CarouselContent>
	</Carousel>
</div>

<style>
	.page-container {
		position: relative;
		height: 100%;
		width: 100%;
		transition: opacity 0.15s ease;
	}

	.page-container.transitioning {
		opacity: 0.5;
	}

	:global(.carousel-full) {
		height: 100%;
		width: 100%;
	}
</style>
