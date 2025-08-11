<script lang="ts">
	import { currentScreen, screenIds, allSettings, isLocalMode, isNightMode, toggleDayNightMode } from '../../stores/settingsStore'
	import { DefaultDayNightSettings } from '../../types'
	import { Button } from '../ui'
	import { Tabs, TabsList, TabsTrigger } from '../ui'

	let editMode = $state(false)
	let renamingScreen = $state<string | null>(null)
	let renameValue = $state('')
	let showDeleteConfirm = $state<string | null>(null)

	// Reactive current tab value based on local mode and current screen
	const currentTab = $derived($isLocalMode ? $currentScreen : 'shared')

	function handleTabChange(value: string): void {
		if (!editMode) {
			if (value === 'shared') {
				isLocalMode.set(false)
			} else {
				currentScreen.set(value)
				isLocalMode.set(true)
			}
		}
	}

	function toggleEditMode(): void {
		editMode = !editMode
		renamingScreen = null
		showDeleteConfirm = null
	}

	function confirmRename(): void {
		if (renamingScreen && renameValue.trim() && renameValue !== renamingScreen) {
			// Update settings structure with new screen name
			allSettings.update((settings) => {
				const oldScreenSettings = settings.screens[renamingScreen!]
				const newScreens = { ...settings.screens }

				// Remove old screen
				delete newScreens[renamingScreen!]
				// Add with new name
				newScreens[renameValue.trim()] = oldScreenSettings || {}

				return {
					...settings,
					screens: newScreens
				}
			})

			// Update current screen if it was the renamed one
			if ($currentScreen === renamingScreen) {
				currentScreen.set(renameValue.trim())
			}
		}
		renamingScreen = null
	}

	function cancelRename(): void {
		renamingScreen = null
	}

	function confirmDelete(): void {
		if (showDeleteConfirm && $screenIds.length > 1) {
			const screenToDelete = showDeleteConfirm

			// Switch to another screen if deleting current screen
			if ($currentScreen === screenToDelete) {
				const otherScreen = $screenIds.find((id) => id !== screenToDelete)
				if (otherScreen) {
					currentScreen.set(otherScreen)
				}
			}

			// Remove from settings
			allSettings.update((settings) => ({
				...settings,
				screens: Object.fromEntries(Object.entries(settings.screens).filter(([key]) => key !== screenToDelete))
			}))
		}
		showDeleteConfirm = null
	}

	function cancelDelete(): void {
		showDeleteConfirm = null
	}

	function addNewScreen(): void {
		const newScreenName = `Screen ${$screenIds.length + 1}`

		// Add new screen to settings
		allSettings.update((settings) => ({
			...settings,
			screens: {
				...settings.screens,
				[newScreenName]: DefaultDayNightSettings
			}
		}))

		// Switch to new screen
		currentScreen.set(newScreenName)
	}

	function handleKeyDown(event: KeyboardEvent): void {
		if (event.key === 'Enter') {
			confirmRename()
		} else if (event.key === 'Escape') {
			cancelRename()
		}
	}

	function focus(element: HTMLElement): void {
		element.focus()
	}
</script>

<!-- Previous tab logic
	onclick={(e) => {
								if (editMode) {
									e.preventDefault();
									startRename(screenId);
								}
							}}
							oncontextmenu={(e) => {
								if (editMode) {
									showDelete(screenId, e);
								}
							}}
-->

<!-- Screen switcher container -->
<div class="screen-switcher-container" role="navigation" aria-label="Screen switcher">
	<Tabs value={currentTab} onValueChange={handleTabChange}>
		<div class="tabs-wrapper">
			<TabsList class="screen-tabs-list">
				<!-- Shared settings tab -->
				<TabsTrigger value="shared" class="screen-tab shared-tab">🌐 Shared</TabsTrigger>

				{#each $screenIds as screenId (screenId)}
					{#if renamingScreen === screenId}
						<input class="screen-rename-input" bind:value={renameValue} onkeydown={handleKeyDown} onblur={confirmRename} use:focus />
					{:else}
						<TabsTrigger value={screenId} disabled={editMode} class="screen-tab">
							{screenId}
							{#if editMode}
								<span class="edit-icon">✏️</span>
							{/if}
						</TabsTrigger>
					{/if}
				{/each}
			</TabsList>

			<!-- Day/Night toggle controls -->
			<div class="daynight-controls">
				{#if editMode}
					<Button variant="secondary" size="sm" onclick={addNewScreen} class="add-screen-btn">+ Add</Button>
				{/if}

				<Button variant={editMode ? 'default' : 'ghost'} size="sm" onclick={toggleEditMode} class="edit-toggle-btn">
					{editMode ? '✓ Done' : '✏️'}
				</Button>

				<!-- Global Day/Night theme toggle (always visible) -->
				<Button
					variant="ghost"
					size="sm"
					onclick={() => toggleDayNightMode()}
					class="daynight-toggle-btn global-theme"
					title={$isNightMode ? 'Switch to Day Theme' : 'Switch to Night Theme'}
				>
					{$isNightMode ? '🌙' : '☀️'}
				</Button>
			</div>
		</div>
	</Tabs>

	<!-- Delete confirmation dialog -->
	{#if showDeleteConfirm}
		<div class="delete-confirm">
			<div class="delete-dialog">
				<p>Delete "{showDeleteConfirm}"?</p>
				<div class="delete-actions">
					<Button variant="destructive" size="sm" onclick={confirmDelete}>Delete</Button>
					<Button variant="secondary" size="sm" onclick={cancelDelete}>Cancel</Button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.screen-switcher-container {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1rem;
	}

	.tabs-wrapper {
		display: flex;
		align-items: center;
		gap: 1rem;
		backdrop-filter: blur(10px);
		padding: 8px 16px;
		border-radius: 12px;
		background: rgba(0, 0, 0, 0.3);
	}

	:global(.screen-tabs-list) {
		background: transparent !important;
		gap: 4px;
	}

	:global(.screen-tab) {
		color: rgba(255, 255, 255, 0.7) !important;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
		font-size: 0.875rem;
		min-width: 60px;
		border-radius: 8px !important;
	}

	:global(.screen-tab[data-state='active']) {
		background: hsl(var(--primary)) !important;
		color: hsl(var(--primary-foreground)) !important;
		box-shadow: 0 0 0 2px hsl(var(--primary) / 0.3);
	}

	:global(.screen-tab.shared-tab[data-state='active']) {
		background: hsl(142 76% 36%) !important; /* Green for shared */
		box-shadow: 0 0 0 2px hsl(142 76% 36% / 0.3);
	}

	.daynight-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.edit-icon {
		margin-left: 4px;
		font-size: 0.75rem;
	}

	.screen-rename-input {
		background: rgba(255, 255, 255, 0.9);
		color: black;
		border: 2px solid hsl(var(--primary));
		padding: 6px 12px;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		min-width: 60px;
		text-align: center;
		outline: none;
	}

	:global(.add-screen-btn) {
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8) !important;
	}

	:global(.edit-toggle-btn) {
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8) !important;
	}

	.delete-confirm {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.delete-dialog {
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(10px);
		padding: 20px;
		border-radius: 12px;
		color: white;
		text-align: center;
		min-width: 200px;
	}

	.delete-actions {
		display: flex;
		gap: 8px;
		margin-top: 12px;
		justify-content: center;
	}

	:global(.daynight-toggle-btn) {
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8) !important;
		font-size: 1.2rem;
		transition: all 0.3s ease;
	}

	:global(.daynight-toggle-btn:hover) {
		transform: scale(1.1);
	}

	:global(.daynight-toggle-btn.global-theme) {
		background: rgba(255, 255, 255, 0.1) !important;
		border: 1px solid rgba(255, 255, 255, 0.2) !important;
	}

	:global(.daynight-toggle-btn.global-theme:hover) {
		background: rgba(255, 255, 255, 0.2) !important;
		border: 1px solid rgba(255, 255, 255, 0.3) !important;
	}
</style>
