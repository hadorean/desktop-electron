<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { api, type ImageInfo } from "./lib/services/api";
  import { apiBaseUrl } from "./lib/stores/apiStore";
  import { DebugContext, DebugMenu } from "@hgrandry/dbg";
  import {
    sharedSettings,
    settings,
    loadSettings,
    expandSettings,
  } from "./lib/stores/settingsStore";
  import SettingsPanel from "./lib/components/settings/SettingsPanel.svelte";
  import TimeDisplay from "./lib/components/layout/TimeDisplay.svelte";
  import WeatherDisplay from "./lib/components/layout/WeatherDisplay.svelte";
  import BackgroundImage from "./lib/components/layout/BackgroundImage.svelte";
  import SettingsButton from "./lib/components/settings/SettingsButton.svelte";
  import ErrorMessage from "./lib/components/settings/ErrorMessage.svelte";
  import SettingsServerUpdate from "./lib/components/settings/SettingsServerUpdate.svelte";
  import ParamsValidator from "./lib/components/shared/ParamsValidator.svelte";
  import ScreenSwitcher from "./lib/components/layout/ScreenSwitcher.svelte";

  let images: ImageInfo[] = [];
  let showSettings: boolean = false;
  let settingsClosingTimeout: number | null = null;
  let errorMessage: string = "";
  let buttonHovered: boolean = false;
  let settingsPanel: HTMLElement | null = null;
  let settingsButton: HTMLElement | null = null;
  let settingsLoaded: boolean = false;

  // Function to fetch images
  async function fetchImages() {
    try {
      images = await api.getImages();
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
      console.error("Error fetching images:", error);
      errorMessage = `Error fetching images: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  }

  // Function to handle API reconnection
  async function handleReconnect() {
    try {
      console.log("Reconnecting to API...");
      errorMessage = "";
      await fetchImages();
      console.log("Reconnection successful");
    } catch (error: unknown) {
      console.error("Reconnection failed:", error);
      errorMessage = `Failed to connect to server at ${$apiBaseUrl || "default URL"}. Please check the URL and try again.`;
    }
  }

  // Initialize the app
  onMount(() => {
    (async () => {
      try {
        // First fetch images
        await fetchImages();

        // Then load saved settings (after we have the images list)
        errorMessage = loadSettings(images);

        // Mark settings as loaded to enable reactive updates
        settingsLoaded = true;

        // Add event listeners
        window.addEventListener("reconnectApi", handleReconnect);
        window.addEventListener("keydown", handleKeyDown);
        document.addEventListener("mousedown", handleClickOutside);

        // Return cleanup function
        return () => {
          window.removeEventListener("reconnectApi", handleReconnect);
          window.removeEventListener("keydown", handleKeyDown);
          document.removeEventListener("mousedown", handleClickOutside);
        };
      } catch (error: unknown) {
        console.error("Error during initialization:", error);
        errorMessage = `Failed to initialize: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    })();
  });

  // Function to handle key down events
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      toggleSettings();
      event.preventDefault();
    }
  }

  // Function to handle click outside events
  function handleClickOutside(event: MouseEvent) {
    if ($expandSettings && settingsPanel && settingsButton) {
      const target = event.target as Node;
      const isClickInside =
        settingsPanel.contains(target) || settingsButton.contains(target);

      if (!isClickInside) {
        expandSettings.set(false);
      }
    }
  }

  // Function to handle settings toggle
  function toggleSettings() {
    expandSettings.update((current) => !current);
  }

  // Reactive block to handle settings state changes
  $: if ($expandSettings === false) {
    settingsClosingTimeout = setTimeout(() => {
      showSettings = false;
    }, 500); // Match the duration of the CSS transition
  } else {
    showSettings = true;
    if (settingsClosingTimeout) {
      clearTimeout(settingsClosingTimeout);
      settingsClosingTimeout = null;
    }
  }

  function handleButtonMouseEnter() {
    buttonHovered = true;
  }

  function handleButtonMouseLeave() {
    buttonHovered = false;
  }
</script>

<div class="full-page-container">
  <DebugContext>
    <DebugMenu visible={true} />

    <ParamsValidator>
      <SettingsServerUpdate />

      <BackgroundImage />

      {#if $settings.showTimeDate}
        <TimeDisplay />
      {/if}

      {#if $settings.showWeather}
        <WeatherDisplay />
      {/if}

      <SettingsButton
        hideButton={$settings.hideButton}
        {buttonHovered}
        onToggle={toggleSettings}
        onMouseEnter={handleButtonMouseEnter}
        onMouseLeave={handleButtonMouseLeave}
        bind:buttonRef={settingsButton}
      />

      <ErrorMessage message={errorMessage} />

      {#if $settings.showScreenSwitcher}
        <ScreenSwitcher />
      {/if}

      <div id="settings-drawer" class:open={showSettings && $expandSettings}>
        {#if showSettings}
          <SettingsPanel
            bind:settingsPanel
            expanded={$expandSettings}
            {images}
          />
        {/if}
      </div>
    </ParamsValidator>
  </DebugContext>
</div>

<style>
  #settings-drawer {
    position: fixed;
    top: 50%;
    height: 100%;
    right: 0;
    transform: translate(500px, -50%);
    transition: transform 0.3s cubic-bezier(0.35, 1.04, 0.58, 1);
  }

  #settings-drawer.open {
    transition: transform 0.5s cubic-bezier(0.35, 1.04, 0.58, 1);
    transform: translate(0, -50%);
  }

  .full-page-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    margin: 0;
    padding: 0;
  }

  /* This ensures the app takes the full viewport */
  :global(body),
  :global(html) {
    margin: 0;
    padding: 0;
    overflow: hidden;
    height: 100%;
    width: 100%;
  }

  :root {
    height: 100%;
    width: 100%;
  }
</style>
