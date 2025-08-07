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
