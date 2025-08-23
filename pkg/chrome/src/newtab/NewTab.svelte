<script lang="ts">
  import { onMount } from 'svelte'

  const getTime = () => {
    const date = new Date()
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${hour}:${minute}`
  }

  let time = getTime()
  const link = 'https://github.com/guocaoyi/create-chrome-ext'

  onMount(() => {
    let intervalor = setInterval(() => {
      time = getTime()
    }, 1000)

    return () => clearInterval(intervalor)
  })
</script>

<iframe src="http://localhost:8080" title="bg" width="100%" height="100%"></iframe>

<style>
  :global(:root) {
    font-family:
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      Roboto,
      Oxygen,
      Ubuntu,
      Cantarell,
      'Open Sans',
      'Helvetica Neue',
      sans-serif;

    color-scheme: light dark;
    background-color: black;

    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }

  :global(html, body, #app) {
    margin: 0;
    padding: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }

  iframe {
    border: none;
    outline: none;
  }

</style>
