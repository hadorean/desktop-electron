<script lang="ts">
  import Versions from './components/Versions.svelte'
  import electronLogo from './assets/electron.svg'

  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')
  
  let serverUrl = ''
  let isServerRunning = false

  // Get server information on component mount
  async function getServerInfo() {
    try {
      serverUrl = await window.api.getServerUrl()
      isServerRunning = await window.api.isServerRunning()
    } catch (error) {
      console.error('Failed to get server info:', error)
    }
  }

  // Background management functions
  async function reloadAllBackgrounds() {
    try {
      await window.api.reloadAllBackgrounds()
      console.log('All backgrounds reloaded')
    } catch (error) {
      console.error('Failed to reload backgrounds:', error)
    }
  }

  async function makeAllInteractive() {
    try {
      await window.api.makeAllBackgroundsInteractive()
      console.log('Made all backgrounds interactive')
    } catch (error) {
      console.error('Failed to make backgrounds interactive:', error)
    }
  }

  async function makeAllNonInteractive() {
    try {
      await window.api.makeAllBackgroundsNonInteractive()
      console.log('Made all backgrounds non-interactive')
    } catch (error) {
      console.error('Failed to make backgrounds non-interactive:', error)
    }
  }

  getServerInfo()
</script>

<img alt="logo" class="logo" src={electronLogo} />
<div class="creator">Powered by electron-vite</div>
<div class="text">
  Build an Electron app with
  <span class="svelte">Svelte</span>
  and
  <span class="ts">TypeScript</span>
</div>
<p class="tip">Please try pressing <code>F12</code> to open the devTool</p>
  <div class="actions">
    <div class="action">
      <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">Documentation</a>
    </div>
    <div class="action">
      <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions a11y-missing-attribute-->
      <a target="_blank" rel="noreferrer" on:click={ipcHandle}>Send IPC</a>
    </div>
    <div class="action">
      <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions a11y-missing-attribute-->
      <a href="#" on:click={reloadAllBackgrounds}>Reload Backgrounds</a>
    </div>
    <div class="action">
      <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions a11y-missing-attribute-->
      <a href="#" on:click={makeAllInteractive}>Make Interactive</a>
    </div>
    <div class="action">
      <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions a11y-missing-attribute-->
      <a href="#" on:click={makeAllNonInteractive}>Make Non-Interactive</a>
    </div>
  </div>
<Versions />

<!-- Server Information -->
<div class="server-info">
  <h3>Local Server</h3>
  <div class="server-status">
    <span class="status-indicator {isServerRunning ? 'running' : 'stopped'}">
      {isServerRunning ? '🟢 Running' : '🔴 Stopped'}
    </span>
  </div>
  {#if isServerRunning && serverUrl}
    <div class="server-url">
      <p>Access your app in browser:</p>
      <a href={serverUrl} target="_blank" rel="noopener noreferrer">{serverUrl}</a>
    </div>
    <div class="server-endpoints">
      <p>Available endpoints:</p>
      <ul>
        <li><a href="{serverUrl}/health" target="_blank">Health Check</a></li>
        <li><a href="{serverUrl}/api/info" target="_blank">App Info</a></li>
      </ul>
    </div>
  {/if}
</div>
