<script lang="ts">
	import { Button, Card, CardContent, CardHeader, Icon } from '$shared/components/ui'
	import { onMount } from 'svelte'
	import BackButton from './BackButton.svelte'

	interface Props {
		transparent?: boolean
		class?: string
		onBack?: () => void
	}

	let { class: className = '', onBack, ...restProps }: Props = $props()

	// State for folder selection
	let selectedFolder = $state('')
	let isSelectingFolder = $state(false)
	let isLoading = $state(true)
	let isSaving = $state(false)

	// Load user options on mount
	onMount(async () => {
		try {
			const result = await window.api.getUserOptions()
			if (result.success && result.data) {
				selectedFolder = result.data.imageDirectory
			}
		} catch (error) {
			console.error('Error loading user options:', error)
		} finally {
			isLoading = false
		}
	})

	// Save options to store
	const saveOptions = async (imageDirectory: string) => {
		try {
			isSaving = true
			const result = await window.api.updateUserOptions({ imageDirectory })
			if (result.success) {
				console.log('User options updated successfully')
			} else {
				console.error('Failed to update user options:', result.error)
			}
		} catch (error) {
			console.error('Error saving user options:', error)
		} finally {
			isSaving = false
		}
	}

	// Handler for browse button
	const handleBrowseFolder = async () => {
		if (!window.api) {
			console.error('API not available')
			return
		}

		isSelectingFolder = true
		try {
			const result = await window.api.showOpenDialog({
				title: 'Select Image Folder',
				buttonLabel: 'Select Folder',
				properties: ['openDirectory']
			})

			if (result.success && result.data && !result.data.canceled && result.data.filePaths.length > 0) {
				const newFolder = result.data.filePaths[0]
				selectedFolder = newFolder
				await saveOptions(newFolder)
			}
		} catch (error) {
			console.error('Error opening folder dialog:', error)
		} finally {
			isSelectingFolder = false
		}
	}

	// Handler for manual path input - debounced save
	let saveTimeout: ReturnType<typeof setTimeout> | null = null
	const handleFolderPathChange = (event: Event) => {
		const target = event.target as HTMLInputElement
		selectedFolder = target.value

		// Debounce save to avoid excessive API calls while typing
		if (saveTimeout) {
			clearTimeout(saveTimeout)
		}
		saveTimeout = setTimeout(() => {
			saveOptions(selectedFolder)
		}, 1000) // Save after 1 second of inactivity
	}
</script>

<div class="options-screen {className}" {...restProps}>
	<!-- Back Button -->
	<div class="header">
		{#if onBack}
			<BackButton onclick={onBack} />
		{/if}
	</div>

	<!-- Header -->
	<div class="options-header">
		<div class="title-section">
			<div class="option-icon">
				<Icon name="cog" size="lg" />
			</div>
			<h1 class="options-title">Options</h1>
		</div>
		<p class="options-description">Configure application settings</p>
	</div>

	<!-- Options Content -->
	<div class="options-content">
		<Card class="mb-6">
			<CardHeader>
				<h1>Images folder</h1>
			</CardHeader>
			<CardContent class="folder-card-content">
				<div class="folder-selection">
					<label for="folder-path" class="folder-label"> Select folder containing your wallpaper images: </label>

					{#if isLoading}
						<div class="loading-state">
							<p class="loading-text">Loading options...</p>
						</div>
					{:else}
						<div class="input-row">
							<input
								id="folder-path"
								type="text"
								value={selectedFolder}
								oninput={handleFolderPathChange}
								placeholder="Enter folder path..."
								class="folder-input"
								disabled={isSaving}
							/>
							<Button variant="outline" onclick={handleBrowseFolder} disabled={isSelectingFolder || isSaving} class="browse-button">
								{isSelectingFolder ? 'Selecting...' : 'Browse'}
							</Button>
						</div>

						<div class="status-row">
							<p class="current-folder">
								Current folder: <span class="folder-path">{selectedFolder || 'No folder selected'}</span>
							</p>
							{#if isSaving}
								<p class="saving-indicator">Saving...</p>
							{/if}
						</div>
					{/if}
				</div>
			</CardContent>
		</Card>
	</div>
</div>

<style>
	.options-screen {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		padding: 2rem;
		height: 100%;
		width: 100%;
		overflow-y: auto;
	}

	.header {
		position: relative;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: flex-start;
		z-index: 10;
	}

	.options-header {
		margin-bottom: 2rem;
		text-align: center;
	}

	.title-section {
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
	}

	.option-icon {
		transform: translateY(5px);
	}

	.options-title {
		font-size: 2.25rem;
		font-weight: bold;
		color: var(--text-primary);
	}

	.options-description {
		color: var(--text-muted);
	}

	.options-content {
		width: 100%;
		max-width: 600px;
		-webkit-app-region: no-drag;
	}

	.folder-input {
		flex: 1;
		background-color: var(--input-bg);
		border: 1px solid var(--input-border);
		border-radius: var(--radius-sm);
		padding: 0.5rem 0.75rem;
		color: var(--text-primary);
		font-size: 0.875rem;
		transition: border-color 0.2s ease;
		-webkit-app-region: no-drag;
	}

	.folder-input:focus {
		outline: none;
		border-color: var(--border-hover);
		box-shadow: 0 0 0 2px rgba(var(--primary), 0.1);
	}

	.folder-input::placeholder {
		color: var(--text-muted);
	}

	.browse-button {
		-webkit-app-region: no-drag;
		min-width: 80px;
	}

	.folder-selection {
		-webkit-app-region: no-drag;
	}

	.folder-label {
		display: block;
		margin-bottom: 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.loading-state {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem 0;
	}

	.loading-text {
		color: var(--text-muted);
	}

	.input-row {
		display: flex;
		gap: 0.5rem;
	}

	.status-row {
		margin-top: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.current-folder {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.folder-path {
		color: var(--text-secondary);
	}

	.saving-indicator {
		font-size: 0.75rem;
		color: var(--primary);
	}

	/* Make sure card components are not draggable */
	:global(.options-content .card) {
		-webkit-app-region: no-drag;
	}
</style>
