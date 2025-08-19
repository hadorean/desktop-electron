<script lang="ts">
	import { Inspect } from '@hgrandry/dbg'
	import { socketService } from '../../services/socket'
	import Lifespan, { Scope } from '../utils/Lifespan.svelte'

	let isConnected = false

	const init = (s: Scope) => {
		s.subscribe(socketService.connectionStatus, connected => {
			isConnected = connected
		})
	}

	const cleanup = () => {
		socketService.cleanup()
	}
</script>

<Lifespan {init} {cleanup} />

<Inspect>
	{#if isConnected}
		<span class="connected">🟢 Socket.IO Connected</span>
	{:else}
		<span class="disconnected">🔴 Socket.IO Disconnected</span>
	{/if}
</Inspect>

<style>
	.connected {
		color: #4ade80;
	}

	.disconnected {
		color: #f87171;
	}
</style>
