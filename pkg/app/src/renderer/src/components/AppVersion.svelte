<script lang="ts">
  let appVersion = ''
  let updateAvailable = false
  let updateDownloaded = false
  let updateProgress = 0

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

  function setupAutoUpdateListeners(): void {
    window.api.onUpdateAvailable((info) => {
      updateAvailable = true
      console.log('Update available:', info)
    })

    window.api.onUpdateDownloadProgress((progressObj) => {
      updateProgress = progressObj.percent || 0
      console.log('Download progress:', progressObj)
    })

    window.api.onUpdateDownloaded((info) => {
      updateDownloaded = true
      updateProgress = 100
      console.log('Update downloaded:', info)
    })
  }

  getAppVersion()
  setupAutoUpdateListeners()
</script>

<div class="version-container">
  <!-- Auto-update section -->
  {#if updateAvailable || updateDownloaded || updateProgress > 0}
    <div class="update-section">
      {#if updateAvailable && !updateDownloaded && updateProgress === 0}
        <div class="update-available">
          <button on:click={downloadUpdate}>🔄 Update available</button>
        </div>
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
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    font-size: 14px;
    gap: 0.5rem;
  }

  .version {
    opacity: 0.5;
  }

  .update-section button {
    background-color: var(--ev-c-brand);
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

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
  /* 
  
   .update-section button:hover {
    background-color: var(--ev-c-brand-hover);
  }
  .update-section {
    margin-top: 20px;
    padding: 16px;
    border: 1px solid var(--ev-c-divider);
    border-radius: 8px;
    background-color: var(--ev-c-bg-soft);
    max-width: 400px;
  }

  .update-section h3 {
    margin: 0 0 12px 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--ev-c-text-1);
  }

  .update-available,
  .update-progress,
  .update-downloaded {
    margin-bottom: 12px;
  }

  .update-available p,
  .update-progress p,
  .update-downloaded p {
    margin: 0 0 8px 0;
    font-size: 14px;
    color: var(--ev-c-text-2);
  }

  

 */
</style>
