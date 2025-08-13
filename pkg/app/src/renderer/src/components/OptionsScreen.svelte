<script lang="ts">
	import { KeyboardShortcuts } from '$shared'
	import { Button, Card, CardContent, CardHeader, CardTitle } from '$shared/components/ui'
	import cogIcon from '../assets/cog.svg?url'
	import AppVersion from './AppVersion.svelte'
	import BackButton from './BackButton.svelte'

	interface Props {
		transparent?: boolean
		class?: string
		onBack?: () => void
	}

	let { class: className = '', onBack, ...restProps }: Props = $props()

	// State for folder selection
	let selectedFolder = $state('D:\\pictures\\wall') // Default value for UI demonstration
	let isSelectingFolder = $state(false)

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
				selectedFolder = result.data.filePaths[0]
			}
		} catch (error) {
			console.error('Error opening folder dialog:', error)
		} finally {
			isSelectingFolder = false
		}
	}

	// Handler for manual path input
	const handleFolderPathChange = (event: Event) => {
		const target = event.target as HTMLInputElement
		selectedFolder = target.value
	}
</script>

<KeyboardShortcuts shortcuts={[{ key: 'Escape', action: onBack }]} />

<div class="options-screen {className}" {...restProps}>
	<!-- Back Button -->
	{#if onBack}
		<BackButton onclick={onBack} />
	{/if}

	<!-- Header -->
	<div class="mb-8 text-center">
		<div class="mb-4 flex items-center justify-center gap-3">
			<img src={cogIcon} alt="Settings" class="cog-icon" />
			<h1 class="text-4xl font-bold text-white">Options</h1>
		</div>
		<p class="text-gray-400">Configure application settings</p>
	</div>

	<!-- Options Content -->
	<div class="options-content">
		<Card class="mb-6">
			<CardHeader>
				<CardTitle>Image Folder</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="folder-selection">
					<label for="folder-path" class="mb-2 block text-sm font-medium text-gray-200"> Select folder containing your wallpaper images: </label>

					<div class="flex gap-2">
						<input
							id="folder-path"
							type="text"
							value={selectedFolder}
							oninput={handleFolderPathChange}
							placeholder="Enter folder path..."
							class="folder-input flex-1"
						/>
						<Button variant="outline" onclick={handleBrowseFolder} disabled={isSelectingFolder} class="browse-button">
							{isSelectingFolder ? 'Selecting...' : 'Browse'}
						</Button>
					</div>

					<p class="mt-2 text-xs text-gray-400">
						Current folder: <span class="text-gray-300">{selectedFolder}</span>
					</p>
				</div>
			</CardContent>
		</Card>
	</div>

	<AppVersion />
</div>

<style>
	/* Ensure text elements are draggable when in transparent mode */
	h1,
	p,
	label {
		-webkit-app-region: drag;
	}

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

	.cog-icon {
		width: 2rem;
		height: 2rem;
		transform: translateY(2px);
		-webkit-app-region: drag;
	}

	.options-content {
		width: 100%;
		max-width: 600px;
		-webkit-app-region: no-drag;
	}

	.folder-input {
		background-color: rgba(55, 65, 81, 0.8);
		border: 1px solid rgba(156, 163, 175, 0.3);
		border-radius: 0.375rem;
		padding: 0.5rem 0.75rem;
		color: white;
		font-size: 0.875rem;
		transition: border-color 0.2s ease;
		-webkit-app-region: no-drag;
	}

	.folder-input:focus {
		outline: none;
		border-color: rgba(59, 130, 246, 0.5);
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
	}

	.folder-input::placeholder {
		color: rgba(156, 163, 175, 0.7);
	}

	.browse-button {
		-webkit-app-region: no-drag;
		min-width: 80px;
	}

	.folder-selection {
		-webkit-app-region: no-drag;
	}

	/* Make sure card components are not draggable */
	:global(.options-content .card) {
		-webkit-app-region: no-drag;
	}
</style>
