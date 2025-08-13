<script lang="ts">
	import { Carousel, CarouselContent, CarouselItem } from '$shared/components/ui'
	import type { Snippet } from 'svelte'
	import { currentPage as currentPageStore, gotoPage } from '../stores/pageStore'

	interface Props {
		settingsContent?: Snippet<[{ currentPage: number; gotoPage: (page: Page) => void }]>
		optionsContent?: Snippet<[{ currentPage: number; gotoPage: (page: Page) => void }]>
		transparent?: boolean
		class?: string
	}

	let { settingsContent, optionsContent, class: className = '', ...restProps }: Props = $props()

	type Page = 'main' | 'options'
	const pages: Page[] = ['main', 'options']

	// Convert store page to carousel index
	let currentPageIndex = $derived(pages.indexOf($currentPageStore))

	// Fade animation state
	let isTransitioning = $state(false)

	function handlePageChange(newIndex: number): void {
		if (newIndex === currentPageIndex) return

		isTransitioning = true

		// Update store with new page
		const newPage = pages[newIndex] || 'main'
		gotoPage(newPage)

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
	<Carousel class="carousel-full" currentIndex={currentPageIndex} onIndexChange={handlePageChange}>
		<CarouselContent currentIndex={currentPageIndex}>
			<!-- Settings Page -->
			<CarouselItem>
				{@render settingsContent?.({ currentPage: currentPageIndex, gotoPage })}
			</CarouselItem>

			<!-- Options Page -->
			<CarouselItem>
				{@render optionsContent?.({ currentPage: currentPageIndex, gotoPage })}
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
