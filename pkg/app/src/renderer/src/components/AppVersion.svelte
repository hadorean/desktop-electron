<script lang="ts">
	import type { VersionInfo } from '$shared/types'

	let appVersion = ''
	let updateAvailable = false
	let updateDownloaded = false
	let updateProgress = 0
	let newVersionInfo: VersionInfo | null = null
	let showInfo = true

	// Test data for development
	// if (false) {
	//   updateAvailable = true
	//   newVersionInfo = {
	//     version: '1.0.0',
	//     releaseDate: new Date().toLocaleDateString(),
	//     releaseNotes: 'This is a test release'
	//   }
	// }

	async function getAppVersion(): Promise<void> {
		try {
			appVersion = await window.api.getAppVersion()
		} catch (error) {
			console.error('Failed to get app version:', error)
		}
	}

	async function downloadUpdate(): Promise<void> {
		try {
			await window.api.downloadUpdate()
			console.log('Downloading update...')
		} catch (error) {
			console.error('Failed to download update:', error)
		}
	}

	async function installUpdate(): Promise<void> {
		try {
			await window.api.installUpdate()
			console.log('Installing update...')
		} catch (error) {
			console.error('Failed to install update:', error)
		}
	}

	// function toggleInfo(): void {
	//   showInfo = !showInfo
	// }

	function setupAutoUpdateListeners(): void {
		window.api.onUpdateAvailable((info: VersionInfo) => {
			newVersionInfo = info
			updateAvailable = true
			console.log('Update available:', info)
		})

		window.api.onUpdateDownloadProgress(progressObj => {
			updateProgress = progressObj.percent || 0
			console.log('Download progress:', progressObj)
		})

		window.api.onUpdateDownloaded(info => {
			updateDownloaded = true
			updateProgress = 100
			console.log('Update downloaded:', info)
		})
	}

	getAppVersion()
	setupAutoUpdateListeners()
</script>

<div class="version-container">
	{#if updateAvailable || updateDownloaded || updateProgress > 0}
		<div class="update-section">
			{#if updateAvailable && !updateDownloaded && updateProgress === 0}
				<div
					class="update-available"
					role="button"
					tabindex="0"
					on:mouseenter={() => (showInfo = true)}
					on:mouseleave={() => (showInfo = false)}
				>
					{#if showInfo && newVersionInfo && updateProgress === 0}
						<div class="update-info">
							<h3>Version: {newVersionInfo?.version}</h3>
							<p class="release-date">
								Released {new Date(newVersionInfo?.releaseDate).toLocaleDateString()}
							</p>
							{#if newVersionInfo?.releaseNotes}
								<h4>Release Notes</h4>
								<p class="release-notes">{newVersionInfo?.releaseNotes}</p>
							{/if}
						</div>
					{/if}
					<button on:click={downloadUpdate}>🔄 Update available</button>
				</div>
				<!-- <button class="whats-new-btn" on:click={toggleInfo}>what's new</button> -->
			{/if}

			{#if !updateDownloaded && updateProgress > 0 && updateProgress < 100}
				<div class="update-progress">
					<span>📥 Downloading update </span>
					<div class="progress-bar">
						<div class="progress-fill" style="width: {updateProgress}%"></div>
					</div>
				</div>
			{/if}

			{#if updateDownloaded}
				<div class="update-downloaded">
					<button on:click={installUpdate}>✅ Install Update</button>
				</div>
			{/if}
		</div>
	{/if}

	{#if appVersion}
		<div class="version">
			<span class="version-label">v</span>
			<span class="version-number">{appVersion}</span>
		</div>
	{/if}
</div>

<style>
	.version-container {
		display: flex;
		flex-direction: row;
		align-items: flex-end;
		font-size: 14px;
		gap: 0.5rem;
	}

	.version {
		opacity: 0.5;
	}

	.update-section {
		display: flex;
		flex-direction: row;
		align-items: center;
	}

	.update-section button {
		background-color: var(--ev-c-brand);
		color: rgb(177, 177, 177);
		border: none;
		border-radius: 4px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition:
			background-color 0.2s,
			color 0.2s;
	}

	.update-section button:hover,
	.update-section button:focus {
		color: white;
	}

	.update-available {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		justify-content: flex-end;
		text-align: right;
		gap: 0.5rem;
	}

	.update-info {
		background-color: rgba(153, 153, 153, 0.082);
		color: rgb(121, 121, 121);
		padding: 1rem;
		border-radius: 8px;
		max-width: 400px;
		bottom: 2rem;
		left: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		justify-content: flex-end;
		align-items: flex-end;
		text-align: right;
	}

	.release-date {
		font-weight: bold;
	}

	h3,
	h4 {
		font-weight: bold;
	}

	h4,
	.release-notes {
		font-style: italic;
	}

	/* button.whats-new-btn {
    color: rgb(156, 156, 156);
    text-decoration: underline;
    border-radius: 15%;
    font-size: 12px;
    padding: 0.25rem 0.5rem;
  } */

	.update-progress {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0.5rem;
	}

	.progress-bar {
		width: 200px;
		height: 8px;
		background-color: rgb(0, 42, 66);
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background-color: rgb(105, 198, 235);
		transition: width 0.3s ease;
	}
</style>
