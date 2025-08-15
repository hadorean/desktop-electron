<script lang="ts">
	import { onMount } from 'svelte'
	import {
		allSettings,
		assignScreenColor,
		assignScreenType,
		currentScreen,
		getFormattedScreenName,
		isLocalMode,
		isNightMode,
		normalizeScreenSettings,
		screenIds,
		toggleDayNightMode
	} from '../../stores/settingsStore'
	import { Icon } from '../ui'

	let containerRef: HTMLDivElement
	let underlineRef: HTMLDivElement
	let tabRefs: HTMLDivElement[] = []

	// Reactive current tab value based on local mode and current screen
	const currentTab = $derived($isLocalMode ? $currentScreen : 'shared')

	// Get all available tabs with their settings
	const allTabs = $derived(() => {
		const tabs = ['shared', ...$screenIds]
		const allScreenIds = $screenIds
		return tabs.map(tabId => {
			const settings = tabId === 'shared' ? $allSettings.shared : $allSettings.screens[tabId]
			// Compute color and type instead of reading from settings
			const color = tabId === 'shared' ? '#ffffff' : assignScreenColor(tabId, allScreenIds)
			const type = tabId === 'shared' ? 'shared' : assignScreenType(tabId)
			return {
				id: tabId,
				settings,
				color,
				type,
				name: tabId === 'shared' ? '' : getFormattedScreenName(tabId, settings),
				icon: tabId === 'shared' ? ('home' as const) : type === 'interactive' ? ('browser' as const) : ('monitor' as const)
			}
		})
	})

	function handleTabClick(tabId: string): void {
		if (tabId === 'shared') {
			isLocalMode.set(false)
		} else {
			currentScreen.set(tabId)
			isLocalMode.set(true)
		}
		updateUnderlinePosition()
	}

	function updateUnderlinePosition(): void {
		if (!underlineRef || !containerRef) return

		const tabs = allTabs()
		const currentIndex = tabs.findIndex(tab => tab.id === currentTab)
		if (currentIndex === -1) return

		const targetTab = tabRefs[currentIndex]
		if (!targetTab) return

		const containerRect = containerRef.getBoundingClientRect()
		const tabRect = targetTab.getBoundingClientRect()

		const left = tabRect.left - containerRect.left
		const width = tabRect.width
		const color = tabs[currentIndex].color

		underlineRef.style.left = `${left}px`
		underlineRef.style.width = `${width}px`
		underlineRef.style.backgroundColor = color
	}

	onMount(() => {
		// Ensure screen settings are normalized on mount
		normalizeScreenSettings()

		// Update underline position after initial render
		setTimeout(() => {
			updateUnderlinePosition()
		}, 0)
	})

	// Update underline when current tab changes
	$effect(() => {
		void currentTab // Track dependency
		setTimeout(() => {
			updateUnderlinePosition()
		}, 0)
	})

	// Export function to be called from SettingsPanel
	export function switchToNextScreen(direction: 'forward' | 'backward' = 'forward'): void {
		// Get all available tabs: shared + screen IDs
		const tabs = allTabs()
		const tabIds = tabs.map(t => t.id)
		const currentIndex = tabIds.indexOf(currentTab)

		// Calculate next index (cycle through)
		let nextIndex: number
		if (direction === 'backward') {
			nextIndex = currentIndex <= 0 ? tabIds.length - 1 : currentIndex - 1
		} else {
			nextIndex = currentIndex >= tabIds.length - 1 ? 0 : currentIndex + 1
		}

		// Switch to next tab
		const nextTab = tabIds[nextIndex]
		handleTabClick(nextTab)
	}
</script>

<!-- Screen switcher container -->
<div class="screen-switcher-container" role="tablist" aria-label="Screen switcher">
	<div class="tabs-wrapper">
		<div class="screen-tabs-container" bind:this={containerRef}>
			{#each allTabs() as tab, index (tab.id)}
				<div
					class="screen-tab"
					class:active={currentTab === tab.id}
					bind:this={tabRefs[index]}
					onclick={() => handleTabClick(tab.id)}
					role="tab"
					tabindex="0"
					onkeydown={e => {
						if (e.key === 'Enter' || e.key === ' ') handleTabClick(tab.id)
					}}
				>
					<Icon name={tab.icon} size="md" className="screen-icon" />
					<span class="screen-name" class:invisible={!tab.name}>
						{tab.name || 'Home'}
					</span>
				</div>
			{/each}

			<!-- Animated underline -->
			<div class="animated-underline" bind:this={underlineRef}></div>
		</div>

		<!-- Day/Night toggle controls -->
		<div class="daynight-controls">
			<!-- Global Day/Night theme toggle -->
			<div
				class="daynight-tab"
				onclick={() => toggleDayNightMode()}
				role="button"
				tabindex="0"
				onkeydown={e => {
					if (e.key === 'Enter' || e.key === ' ') toggleDayNightMode()
				}}
				title={$isNightMode ? 'Switch to Day Theme' : 'Switch to Night Theme'}
			>
				<Icon name={$isNightMode ? 'moon' : 'sun'} size="md" className="daynight-icon" />
				<span class="screen-name invisible">Theme</span>
			</div>
		</div>
	</div>
</div>

<style>
	.screen-switcher-container {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 3rem;
		outline: none;
		border-radius: 0.5rem;
	}

	.tabs-wrapper {
		display: flex;
		align-items: center;
		gap: 1rem;
		/* backdrop-filter: blur(10px);	 */
		padding: 8px 16px;
		border-radius: 12px;
		/* background: rgba(0, 0, 0, 0.3); */
	}

	.screen-tabs-container {
		position: relative;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 4px 0;
	}

	.screen-tab {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 8px 12px;
		cursor: pointer;
		transition: all 0.2s ease;
		border-radius: 8px;
		min-width: 60px;
		outline: none;
	}

	.screen-tab:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	:global(.screen-tab .screen-icon) {
		color: white;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.8));
		transition: transform 0.2s ease;
	}

	.screen-tab.active :global(.screen-icon) {
		transform: scale(1.1);
	}

	.screen-name {
		color: rgba(255, 255, 255, 0.425);
		font-size: 0.75rem;
		font-weight: 500;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
		white-space: nowrap;
		text-align: center;
		transition: color 0.2s ease;
	}

	.screen-tab.active .screen-name {
		color: rgba(255, 255, 255, 0.9);
	}

	.screen-name.invisible {
		visibility: hidden;
	}

	.animated-underline {
		position: absolute;
		bottom: -2px;
		left: 0;
		height: 3px;
		border-radius: 1.5px;
		background-color: #ffffff;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		pointer-events: none;
		box-shadow: 0 0 8px currentColor;
	}

	.daynight-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.daynight-tab {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 8px 12px;
		cursor: pointer;
		transition: all 0.2s ease;
		border-radius: 8px;
		min-width: 60px;
		outline: none;
	}

	.daynight-tab:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.daynight-tab:focus-visible {
		background: rgba(255, 255, 255, 0.1);
		outline: none;
	}

	:global(.daynight-tab .daynight-icon) {
		color: white;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.8));
		transition:
			all 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			transform 0.3s ease;
		transform-origin: center;
	}

	.daynight-tab:hover :global(.daynight-icon),
	.daynight-tab:focus-visible :global(.daynight-icon) {
		transform: translateY(10px) scale(1.15);
		transition: transform 0.8s ease;
	}

	.daynight-tab:hover .screen-name,
	.daynight-tab:focus-visible .screen-name {
		opacity: 0.3;
	}
</style>
