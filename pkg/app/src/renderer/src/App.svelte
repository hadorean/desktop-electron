<script lang="ts">
  import { Versions, AppVersion, AppHeader, ActionButtons, ServerInfo } from './components'
  import { DebugContext, DebugMenu } from '@hgrandry/dbg'

  const disabled = true
</script>

<DebugContext>
  <DebugMenu visible={true} />

  <AppVersion />
  <ActionButtons />

  {#if !disabled}
    <AppHeader />
    <ServerInfo />
    <Versions />
  {/if}
</DebugContext>

<style>
  .init-error,
  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    padding: 20px;
    text-align: center;
  }

  .init-error {
    color: #ff4444;
  }

  .init-error button {
    margin-top: 10px;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    background: #007acc;
    color: white;
    cursor: pointer;
  }

  .init-error button:hover {
    background: #005999;
  }

  .loading {
    color: #666;
  }

  .connection-status {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 100;
  }
</style>
