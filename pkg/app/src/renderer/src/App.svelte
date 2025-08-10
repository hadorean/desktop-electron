<script lang="ts">
  import SettingsPanel from '$shared/components/settings/SettingsPanel.svelte'
  import { api, type ImageInfo } from '$shared/services'
  import { effectiveApiUrl } from '$shared/stores/apiStore'
  import { debugVisible, setDebugMenuVisible } from '$shared/stores/debugStore'
  import { ErrorMessage } from '@heyketsu/shared'
  import { Versions, AppVersion, AppHeader, ActionButtons, ServerInfo } from './components'
  import { DebugMenu } from '@hgrandry/dbg'
  import { onMount } from 'svelte'
  import SettingsServerUpdate from '$shared/components/settings/SettingsServerUpdate.svelte'
  import ScreenSwitcher from '$shared/components/settings/ScreenSwitcher.svelte'
  const disabled = true
  let images: ImageInfo[] = []
  let errorMessage: string = ''

  // Function to fetch images
  async function fetchImages() {
    try {
      images = await api.getImages()
      //console.log('Fetched images:', images);

      // settings.subscribe((current) => {
      //     if (!current?.selectedImage && images.length > 0) {
      //         sharedSettings.set({
      //             ...current,
      //             selectedImage: images[0].name,
      //         });
      //     }
      // });
    } catch (error: unknown) {
      console.error('Error fetching images:', error)
      errorMessage = `Error fetching images: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }

  onMount(async () => {
    effectiveApiUrl.set('http://localhost:8080')
    
    await fetchImages()
    
    // Setup IPC listener for debug state changes
    if (window.api) {
      window.api.onDebugStateChanged((visible) => {
        console.log('Desktop app: Received debug state change:', visible)
        setDebugMenuVisible(visible)
      })
    }
  })
</script>

<SettingsPanel {images} expanded={true} />
<SettingsServerUpdate />
<AppVersion />
<ActionButtons />
<ErrorMessage message={errorMessage} />

{#if !disabled}
  <AppHeader />
  <ServerInfo />
  <Versions />
{/if}
<DebugMenu visible={$debugVisible} align="bottom-right" margin={{ x: '1rem', y: '3rem' }} />

<style>
</style>
