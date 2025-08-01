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
