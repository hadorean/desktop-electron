<script lang="ts">
	import { currentScreen, screenIds, allSettings } from '../../stores/settingsStore';

	let isVisible = false;
	let hoverTimeout: NodeJS.Timeout | null = null;
	let editMode = false;
	let renamingScreen: string | null = null;
	let renameValue = '';
	let showDeleteConfirm: string | null = null;

	function handleMouseEnter() {
		if (hoverTimeout) {
			clearTimeout(hoverTimeout);
			hoverTimeout = null;
		}
		isVisible = true;
	}

	function handleMouseLeave() {
		hoverTimeout = setTimeout(() => {
			if (!editMode) {
				// Don't hide if in edit mode
				isVisible = false;
			}
		}, 300);
	}

	function switchToScreen(screenId: string) {
		if (!editMode) {
			currentScreen.set(screenId);
		}
	}

	function toggleEditMode() {
		editMode = !editMode;
		if (editMode) {
			isVisible = true; // Keep visible in edit mode
		}
		renamingScreen = null;
		showDeleteConfirm = null;
	}

	function startRename(screenId: string) {
		renamingScreen = screenId;
		renameValue = screenId;
	}

	function confirmRename() {
		if (renamingScreen && renameValue.trim() && renameValue !== renamingScreen) {
			// Update settings structure with new screen name
			allSettings.update((settings) => {
				const oldScreenSettings = settings.screens[renamingScreen!];
				const newScreens = { ...settings.screens };

				// Remove old screen
				delete newScreens[renamingScreen!];
				// Add with new name
				newScreens[renameValue.trim()] = oldScreenSettings || {};

				return {
					...settings,
					screens: newScreens
				};
			});

			// Update current screen if it was the renamed one
			if ($currentScreen === renamingScreen) {
				currentScreen.set(renameValue.trim());
			}
		}
		renamingScreen = null;
	}

	function cancelRename() {
		renamingScreen = null;
	}

	function showDelete(screenId: string, event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		if ($screenIds.length > 1) {
			// Only allow delete if more than one screen
			showDeleteConfirm = screenId;
		}
	}

	function confirmDelete() {
		if (showDeleteConfirm && $screenIds.length > 1) {
			const screenToDelete = showDeleteConfirm;

			// Switch to another screen if deleting current screen
			if ($currentScreen === screenToDelete) {
				const otherScreen = $screenIds.find((id) => id !== screenToDelete);
				if (otherScreen) {
					currentScreen.set(otherScreen);
				}
			}

			// Remove from settings
			allSettings.update((settings) => ({
				...settings,
				screens: Object.fromEntries(
					Object.entries(settings.screens).filter(([key]) => key !== screenToDelete)
				)
			}));
		}
		showDeleteConfirm = null;
	}

	function cancelDelete() {
		showDeleteConfirm = null;
	}

	function addNewScreen() {
		const newScreenName = `Screen ${$screenIds.length + 1}`;

		// Add new screen to settings
		allSettings.update((settings) => ({
			...settings,
			screens: {
				...settings.screens,
				[newScreenName]: {}
			}
		}));

		// Switch to new screen
		currentScreen.set(newScreenName);
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			confirmRename();
		} else if (event.key === 'Escape') {
			cancelRename();
		}
	}

	function focus(element: HTMLElement) {
		element.focus();
	}
</script>

<!-- Hover trigger area at bottom center -->
<div
	class="screen-switcher-trigger"
	on:mouseenter={handleMouseEnter}
	on:mouseleave={handleMouseLeave}
	role="navigation"
	aria-label="Screen switcher"
>
	<!-- Pills container -->
	<div class="screen-pills" class:visible={isVisible}>
		{#each $screenIds as screenId}
			{#if renamingScreen === screenId}
				<input
					class="screen-rename-input"
					bind:value={renameValue}
					on:keydown={handleKeyDown}
					on:blur={confirmRename}
					use:focus
				/>
			{:else}
				<button
					class="screen-pill"
					class:active={screenId === $currentScreen}
					class:edit-mode={editMode}
					on:click={() => (editMode ? startRename(screenId) : switchToScreen(screenId))}
					on:contextmenu={(e) => (editMode ? showDelete(screenId, e) : null)}
					aria-label={editMode ? 'Rename screen {screenId}' : 'Switch to screen {screenId}'}
				>
					{screenId}
					{#if editMode}
						<span class="edit-icon">✏️</span>
					{/if}
				</button>
			{/if}
		{/each}

		{#if editMode}
			<button class="add-screen-btn" on:click={addNewScreen} aria-label="Add new screen">
				+ Add
			</button>
		{/if}

		<button
			class="edit-toggle-btn"
			on:click={toggleEditMode}
			aria-label={editMode ? 'Exit edit mode' : 'Enter edit mode'}
		>
			{editMode ? '✓ Done' : '✏️'}
		</button>
	</div>

	<!-- Delete confirmation dialog -->
	{#if showDeleteConfirm}
		<div class="delete-confirm">
			<div class="delete-dialog">
				<p>Delete "{showDeleteConfirm}"?</p>
				<div class="delete-actions">
					<button class="delete-btn" on:click={confirmDelete}>Delete</button>
					<button class="cancel-btn" on:click={cancelDelete}>Cancel</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.screen-switcher-trigger {
		position: fixed;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 200px;
		height: 80px;
		z-index: 900;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding-bottom: 20px;
	}

	.screen-pills {
		display: flex;
		gap: 8px;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(10px);
		padding: 8px 16px;
		border-radius: 24px;
		opacity: 0;
		transform: translateY(20px);
		transition: all 0.3s cubic-bezier(0.35, 1.04, 0.58, 1);
		pointer-events: none;
	}

	.screen-pills.visible {
		opacity: 1;
		transform: translateY(0);
		pointer-events: auto;
	}

	.screen-pill {
		background: rgba(255, 255, 255, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.3);
		color: white;
		padding: 6px 12px;
		border-radius: 16px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
		min-width: 60px;
		text-align: center;
	}

	.screen-pill:hover {
		background: rgba(255, 255, 255, 0.3);
		border-color: rgba(255, 255, 255, 0.5);
		transform: translateY(-2px);
	}

	.screen-pill.active {
		background: rgba(59, 130, 246, 0.8);
		border-color: rgba(59, 130, 246, 1);
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
	}

	.screen-pill.active:hover {
		background: rgba(59, 130, 246, 0.9);
	}

	.screen-pill.edit-mode {
		background: rgba(255, 193, 7, 0.3);
		border-color: rgba(255, 193, 7, 0.6);
	}

	.edit-icon {
		margin-left: 4px;
		font-size: 0.75rem;
	}

	.screen-rename-input {
		background: rgba(255, 255, 255, 0.9);
		color: black;
		border: 2px solid rgba(59, 130, 246, 1);
		padding: 6px 12px;
		border-radius: 16px;
		font-size: 0.875rem;
		font-weight: 500;
		min-width: 60px;
		text-align: center;
		outline: none;
	}

	.add-screen-btn {
		background: rgba(34, 197, 94, 0.3);
		border: 1px solid rgba(34, 197, 94, 0.6);
		color: white;
		padding: 6px 12px;
		border-radius: 16px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
	}

	.add-screen-btn:hover {
		background: rgba(34, 197, 94, 0.5);
		transform: translateY(-2px);
	}

	.edit-toggle-btn {
		color: white;
		padding: 6px 12px;
		border-radius: 16px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
		margin-left: 8px;
	}

	.edit-toggle-btn:hover {
		background: rgba(156, 163, 175, 0.5);
		transform: translateY(-2px);
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

	.delete-btn {
		background: rgba(239, 68, 68, 0.8);
		border: 1px solid rgba(239, 68, 68, 1);
		color: white;
		padding: 6px 16px;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 500;
	}

	.delete-btn:hover {
		background: rgba(239, 68, 68, 1);
	}

	.cancel-btn {
		background: rgba(75, 85, 99, 0.8);
		border: 1px solid rgba(75, 85, 99, 1);
		color: white;
		padding: 6px 16px;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 500;
	}

	.cancel-btn:hover {
		background: rgba(75, 85, 99, 1);
	}
</style>
