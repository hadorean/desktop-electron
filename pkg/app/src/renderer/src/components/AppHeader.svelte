<script lang="ts">
  // Disabled for now - placeholder component

  import electronLogo from '../assets/electron.svg'
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

<style>
  .logo {
    margin-bottom: 20px;
    -webkit-user-drag: none;
    height: 128px;
    width: 128px;
    will-change: filter;
    transition: filter 300ms;
  }

  .logo:hover {
    filter: drop-shadow(0 0 1.2em #6988e6aa);
  }

  .creator {
    font-size: 14px;
    line-height: 16px;
    color: var(--ev-c-text-2);
    font-weight: 600;
    margin-bottom: 10px;
  }

  .text {
    font-size: 28px;
    color: var(--ev-c-text-1);
    font-weight: 700;
    line-height: 32px;
    text-align: center;
    margin: 0 10px;
    padding: 16px 0;
  }

  .tip {
    font-size: 16px;
    line-height: 24px;
    color: var(--ev-c-text-2);
    font-weight: 600;
  }

  .svelte {
    background: -webkit-linear-gradient(315deg, #ff3e00 35%, #647eff);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 700;
  }

  .ts {
    background: -webkit-linear-gradient(315deg, #3178c6 45%, #f0dc4e);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 700;
  }

  code {
    font-weight: 600;
    padding: 3px 5px;
    border-radius: 2px;
    background-color: var(--color-background-mute);
    font-family:
      ui-monospace,
      SFMono-Regular,
      SF Mono,
      Menlo,
      Consolas,
      Liberation Mono,
      monospace;
    font-size: 85%;
  }

  @media (max-width: 720px) {
    .text {
      font-size: 20px;
    }
  }

  @media (max-width: 350px) {
    .tip {
      display: none;
    }
  }
</style>
