<script lang="ts">
	import { KeyboardShortcuts } from '$shared'
	import { Carousel, CarouselContent, CarouselItem } from '$shared/components/ui'
	import type { Snippet } from 'svelte'

	interface Props {
		settingsContent?: Snippet<[{ currentPage: number; gotoPage: (page: Page) => void }]>
		optionsContent?: Snippet<[{ currentPage: number; gotoPage: (page: Page) => void }]>
		transparent?: boolean
		class?: string
	}

	let { settingsContent, optionsContent, class: className = '', ...restProps }: Props = $props()

	// Page navigation state
	let currentPage = $state(0) // 0 = settings, 1 = options

	type Page = 'main' | 'options'
	const pages: Page[] = ['main', 'options']

	export function gotoPage(page: Page): void {
		currentPage = pages.indexOf(page)
		handlePageChange(currentPage)
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

<KeyboardShortcuts
	shortcuts={[
		{
			key: 'Escape',
			action: () => {
				if (currentPage === 0) {
					gotoPage('options')
				} else {
					gotoPage('main')
				}
			}
		}
	]}
/>

<div class="page-container {className}" class:transitioning={isTransitioning} {...restProps}>
	<Carousel class="carousel-full" currentIndex={currentPage} onIndexChange={handlePageChange}>
		<CarouselContent currentIndex={currentPage}>
			<!-- Settings Page -->
			<CarouselItem>
				{@render settingsContent?.({ currentPage, gotoPage })}
			</CarouselItem>

			<!-- Options Page -->
			<CarouselItem>
				{@render optionsContent?.({ currentPage, gotoPage })}
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
