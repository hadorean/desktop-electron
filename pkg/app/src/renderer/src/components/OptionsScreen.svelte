<script lang="ts">
	import { Button, Card, CardContent, CardHeader, Icon, Slider, Switch } from '$shared/components/ui'
	import { updateUserOptions } from '$shared/stores'
	import { onMount } from 'svelte'
	import BackButton from './BackButton.svelte'

	interface Props {
		transparent?: boolean
		class?: string
		onBack?: () => void
	}

	let { class: className = '', onBack, ...restProps }: Props = $props()

	// State for options
	let selectedFolder = $state('')
	let port = $state(8080)
	let autoStart = $state(true)
	let openWindowOnStart = $state(false)
	let windowOpacity = $state(1.0)

	let isSelectingFolder = $state(false)
	let isLoading = $state(true)

	// Port management state
	let originalPort = $state(8080)
	let portPendingRestart = $state(false)
	let serverStatus = $state<'connected' | 'pending' | 'disconnected' | 'unknown'>('unknown')
	let isRestartingServer = $state(false)
	let statusCheckInterval: ReturnType<typeof setInterval> | null = null

	// Load user options on mount
	onMount(async () => {
		try {
			const result = await window.api.getUserOptions()

			if (result.success && result.data) {
				selectedFolder = result.data.imageDirectory
				port = result.data.port || 8080
				originalPort = port
				autoStart = result.data.autoStart ?? true
				openWindowOnStart = result.data.openWindowOnStart ?? false
				windowOpacity = result.data.windowOpacity ?? 1.0
			}
			await checkServerStatus()
		} catch (error) {
			console.error('Error loading user options:', error)
		} finally {
			isLoading = false
		}

		// Start periodic server status checking
		startStatusMonitoring()

		// Cleanup on unmount
		return () => {
			stopStatusMonitoring()
		}
	})

	// Save options to store
	const saveOptions = async (
		partialOptions: Partial<{
			imageDirectory: string
			port: number
			autoStart: boolean
			openWindowOnStart: boolean
			windowOpacity: number
		}>
	) => {
		try {
			// isSaving = true
			const options = {
				imageDirectory: selectedFolder,
				port,
				autoStart,
				openWindowOnStart,
				windowOpacity,
				...partialOptions
			}
			const result = await window.api.updateUserOptions(options)
			if (result.success) {
				console.log('User options updated successfully')
			} else {
				console.error('Failed to update user options:', result.error)
			}
		} catch (error) {
			console.error('Error saving user options:', error)
		} finally {
			// isSaving = false
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
				await saveOptions({ imageDirectory: newFolder })
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
		saveAfterDelay({ imageDirectory: selectedFolder })
	}

	// Handler for port change
	const handlePortChange = (event: Event) => {
		const target = event.target as HTMLInputElement
		const newPort = parseInt(target.value) || 8080
		port = newPort
		portPendingRestart = newPort !== originalPort
		if (portPendingRestart) {
			serverStatus = 'pending'
		}
	}

	// Handler for switch changes
	const handleAutoStartChange = (checked: boolean) => {
		autoStart = checked
		saveAfterDelay({ autoStart: checked })
	}

	const handleOpenWindowOnStartChange = (checked: boolean) => {
		openWindowOnStart = checked
		saveAfterDelay({ openWindowOnStart: checked })
	}

	// Handler for opacity slider
	const handleOpacityChange = (value: number[]) => {
		windowOpacity = value[0]
		saveAfterDelay({ windowOpacity: value[0] })
	}

	// Check server status
	const checkServerStatus = async () => {
		try {
			const result = await window.api.getServerStatus()
			if (result.success && result.data) {
				const newStatus = result.data.status as typeof serverStatus
				if (newStatus !== serverStatus) {
					console.log(`🔄 Server status changed: ${serverStatus} → ${newStatus}`)
					serverStatus = newStatus
				}
			} else {
				serverStatus = 'unknown'
			}
		} catch (error) {
			console.error('Error checking server status:', error)
			serverStatus = 'unknown'
		}
	}

	// Start monitoring server status
	const startStatusMonitoring = () => {
		// Check status immediately
		checkServerStatus()
		
		// Then check every 3 seconds (slower for normal operation)
		statusCheckInterval = setInterval(() => {
			checkServerStatus()
		}, 3000)
	}

	// Start faster monitoring during server restart
	const startFastStatusMonitoring = () => {
		stopStatusMonitoring()
		
		// Check every 500ms during restart for quick feedback
		statusCheckInterval = setInterval(() => {
			checkServerStatus()
		}, 500)
		
		// After 10 seconds, switch back to normal monitoring
		setTimeout(() => {
			if (statusCheckInterval) {
				stopStatusMonitoring()
				startStatusMonitoring()
			}
		}, 10000)
	}

	// Stop monitoring server status
	const stopStatusMonitoring = () => {
		if (statusCheckInterval) {
			clearInterval(statusCheckInterval)
			statusCheckInterval = null
		}
	}

	// Apply port changes
	const applyPortChange = async () => {
		if (!portPendingRestart) return

		isRestartingServer = true
		serverStatus = 'pending'
		
		// Start fast monitoring during restart
		startFastStatusMonitoring()

		try {
			// First save the port to user options
			await saveOptions({ port })

			// Then restart the server with the new port
			const result = await window.api.restartServerWithPort(port)

			if (result.success) {
				originalPort = port
				portPendingRestart = false
				console.log('✅ Server restarted successfully on port', port)
				
				// Check server status immediately to update UI
				await checkServerStatus()
			} else {
				serverStatus = 'disconnected'
				console.error('❌ Failed to restart server:', result.error)
			}
		} catch (error) {
			console.error('Error restarting server:', error)
			serverStatus = 'disconnected'
		} finally {
			isRestartingServer = false
		}
	}

	// Cancel port changes
	const cancelPortChange = () => {
		port = originalPort
		portPendingRestart = false
		serverStatus = 'connected'
	}

	function saveAfterDelay(
		options: Partial<{
			imageDirectory: string
			port: number
			autoStart: boolean
			openWindowOnStart: boolean
			windowOpacity: number
		}>
	) {
		updateUserOptions((current) => ({ ...current, ...options }))
		if (saveTimeout) {
			clearTimeout(saveTimeout)
		}
		saveTimeout = setTimeout(() => {
			saveOptions(options)
		}, 1000)
	}
</script>

<div class="options-screen no-drag {className}" {...restProps}>
	<!-- Back Button -->
	<div class="header">
		{#if onBack}{/if}
	</div>

	<!-- Header -->
	<div class="options-header">
		<div class="title-section">
			<div class="left" style="position: absolute; left: 2rem;">
				<BackButton onclick={onBack} />
			</div>
			<div class="option-icon">
				<Icon name="cog" size="lg" />
			</div>
			<h1 class="options-title">Options</h1>
		</div>
		<p class="options-description">Configure application settings</p>
	</div>

	{#if isLoading}
		<div class="loading-state">
			<p class="loading-text">Loading options...</p>
		</div>
	{:else}
		<!-- Options Content -->
		<div class="options-content no-drag">
			<Card class="no-drag option-card">
				<CardHeader>
					<h1>Images folder</h1>
				</CardHeader>
				<CardContent class="folder-card-content no-drag">
					<div class="folder-selection">
						<label for="folder-path" class="folder-label"> Select folder containing your wallpaper images: </label>

						<div class="input-row">
							<input
								id="folder-path"
								type="text"
								value={selectedFolder}
								oninput={handleFolderPathChange}
								placeholder="Enter folder path..."
								class="folder-input"
							/>
							<Button variant="outline" onclick={handleBrowseFolder} disabled={isSelectingFolder} class="browse-button">
								{isSelectingFolder ? 'Selecting...' : 'Browse'}
							</Button>
						</div>

						<div class="status-row">
							<p class="current-folder">
								Current folder: <span class="folder-path">{selectedFolder || 'No folder selected'}</span>
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<!-- Startup Options -->
			<Card class="option-card">
				<CardHeader>
					<h1>Startup Options</h1>
				</CardHeader>
				<CardContent class="folder-card-content">
					{#if isLoading}
						<div class="loading-state">
							<p class="loading-text">Loading...</p>
						</div>
					{:else}
						<div class="option-section">
							<div class="switch-row">
								<div class="switch-info">
									<label for="auto-start-switch" class="option-label">Auto-start application</label>
									<p class="option-description">Automatically start the application when system boots</p>
								</div>
								<Switch id="auto-start-switch" checked={autoStart} onCheckedChange={handleAutoStartChange} />
							</div>
						</div>

						<div class="option-section">
							<div class="switch-row">
								<div class="switch-info">
									<label for="open-window-switch" class="option-label">Open window on start</label>
									<p class="option-description">Show the main window when application starts</p>
								</div>
								<Switch id="open-window-switch" checked={openWindowOnStart} onCheckedChange={handleOpenWindowOnStartChange} />
							</div>
						</div>
					{/if}
				</CardContent>
			</Card>

			<!-- Server Configuration -->
			<Card class="option-card">
				<CardHeader>
					<h1>Server Configuration</h1>
				</CardHeader>
				<CardContent class="folder-card-content">
					<div class="option-section">
						<div class="server-status-row">
							<div class="status-indicator">
								<div class="status-icon status-{serverStatus}"></div>
								<span class="status-text">
									{#if serverStatus === 'connected'}
										Connected (Port {originalPort})
									{:else if serverStatus === 'pending'}
										{portPendingRestart ? 'Restart Required' : 'Connecting...'}
									{:else if serverStatus === 'disconnected'}
										Disconnected
									{:else}
										Checking Status...
									{/if}
								</span>
							</div>
						</div>

						<div class="input-row">
							<label for="port-input" class="option-label">Port:</label>
							<input
								id="port-input"
								type="number"
								min="1000"
								max="65535"
								value={port}
								oninput={handlePortChange}
								placeholder="8080"
								class="option-input"
								disabled={isRestartingServer}
							/>
						</div>

						{#if portPendingRestart}
							<div class="port-actions">
								<p class="port-warning">Changing the port requires restarting the server and will reload all background windows.</p>
								<div class="button-row">
									<Button variant="outline" onclick={cancelPortChange} disabled={isRestartingServer} class="cancel-button">Cancel</Button>
									<Button onclick={applyPortChange} disabled={isRestartingServer} class="apply-button">
										{isRestartingServer ? 'Restarting...' : 'Apply Changes'}
									</Button>
								</div>
							</div>
						{/if}

						<p class="option-description">Port number for the local server (1000-65535)</p>
					</div>
				</CardContent>
			</Card>

			<!-- Window Settings -->
			<Card class="option-card">
				<CardHeader>
					<h1>Window Settings</h1>
				</CardHeader>
				<CardContent class="folder-card-content">
					{#if isLoading}
						<div class="loading-state">
							<p class="loading-text">Loading...</p>
						</div>
					{:else}
						<div class="option-section">
							<label for="window-opacity-slider" class="option-label">Window Opacity:</label>
							<div class="slider-section">
								<Slider value={[windowOpacity]} min={0} max={1} step={0.01} onValueChange={handleOpacityChange} class="opacity-slider" />
								<span class="slider-value">{(windowOpacity * 100).toFixed(0)}%</span>
							</div>
							<p class="option-description">Adjust the transparency of application windows</p>
						</div>
					{/if}
				</CardContent>
			</Card>
		</div>
	{/if}

	<!-- {#if isSaving}
		<p class="saving-indicator">Saving...</p>
	{/if} -->
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
		display: flex;
		flex-direction: column;
		gap: 1rem;
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
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
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

	.option-section {
		margin-bottom: 1.5rem;
		-webkit-app-region: no-drag;
	}

	.option-section:last-child {
		margin-bottom: 0;
	}

	.option-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.option-description {
		font-size: 0.75rem;
		color: var(--text-muted);
		margin-top: 0.25rem;
		line-height: 1.4;
	}

	.option-input {
		flex: 1;
		max-width: 200px;
		background-color: var(--input-bg);
		border: 1px solid var(--input-border);
		border-radius: var(--radius-sm);
		padding: 0.5rem 0.75rem;
		color: var(--text-primary);
		font-size: 0.875rem;
		transition: border-color 0.2s ease;
		-webkit-app-region: no-drag;
	}

	.option-input:focus {
		outline: none;
		border-color: var(--border-hover);
		box-shadow: 0 0 0 2px rgba(var(--primary), 0.1);
	}

	.option-input::placeholder {
		color: var(--text-muted);
	}

	.switch-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.switch-info {
		flex: 1;
	}

	.slider-section {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-top: 0.5rem;
	}

	:global(.opacity-slider) {
		flex: 1;
		max-width: 300px;
	}

	.slider-value {
		min-width: 3rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
		text-align: right;
	}

	.option-card {
		margin-bottom: 1.5rem;
	}

	/* Make sure card components are not draggable */
	:global(.options-content .card) {
		-webkit-app-region: no-drag;
	}

	/* Server status styles */
	.server-status-row {
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		justify-content: flex-start;
	}

	.status-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.status-icon {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.status-icon.status-connected {
		background-color: #22c55e; /* Green */
		box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
	}

	.status-icon.status-pending {
		background-color: #f59e0b; /* Amber */
		box-shadow: 0 0 8px rgba(245, 158, 11, 0.5);
	}

	.status-icon.status-disconnected {
		background-color: #ef4444; /* Red */
		box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
	}

	.status-icon.status-unknown {
		background-color: #6b7280; /* Gray */
		box-shadow: 0 0 8px rgba(107, 114, 128, 0.5);
	}

	.status-text {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	/* Port actions styles */
	.port-actions {
		margin-top: 1rem;
		padding: 1rem;
		background-color: var(--background-secondary);
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}

	.port-warning {
		font-size: 0.875rem;
		color: var(--text-warning);
		margin-bottom: 1rem;
		line-height: 1.4;
	}

	.button-row {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
	}

	:global(.cancel-button) {
		min-width: 80px;
	}

	:global(.apply-button) {
		min-width: 120px;
	}
</style>
