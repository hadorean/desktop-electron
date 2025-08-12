<script lang="ts">
	import { Button, Inspect } from '@hgrandry/dbg'
	import { IpcEvents } from '$shared/types/ipc'

	const ipcHandle = (): void => window.electron.ipcRenderer.send(IpcEvents.Ping)

	async function reloadAllBackgrounds(): Promise<void> {
		try {
			await window.api.reloadAllBackgrounds()
			console.log('All backgrounds reloaded')
		} catch (error) {
			console.error('Failed to reload backgrounds:', error)
		}
	}

	async function makeAllInteractive(): Promise<void> {
		try {
			await window.api.makeAllBackgroundsInteractive()
			console.log('Made all backgrounds interactive')
		} catch (error) {
			console.error('Failed to make backgrounds interactive:', error)
		}
	}

	async function makeAllNonInteractive(): Promise<void> {
		try {
			await window.api.makeAllBackgroundsNonInteractive()
			console.log('Made all backgrounds non-interactive')
		} catch (error) {
			console.error('Failed to make backgrounds non-interactive:', error)
		}
	}

	async function checkForUpdates(): Promise<void> {
		try {
			await window.api.checkForUpdates()
			console.log('Checking for updates...')
		} catch (error) {
			console.error('Failed to check for updates:', error)
		}
	}
</script>

<Inspect>
	<Button name="Send IPC" onclick={ipcHandle} />
	<Button name="Reload Backgrounds" onclick={reloadAllBackgrounds} />
	<Button name="Make Interactive" onclick={makeAllInteractive} />
	<Button name="Make Non-Interactive" onclick={makeAllNonInteractive} />
	<Button name="Check for Updates" onclick={checkForUpdates} />
	<a href="https://electron-vite.org/" target="_blank" rel="noreferrer">Documentation</a>
</Inspect>

<style>
	a {
		color: white;
	}
</style>
