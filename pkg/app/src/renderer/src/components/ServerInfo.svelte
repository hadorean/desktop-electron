<script lang="ts">
	// Disabled for now - placeholder component
	let serverUrl = ''
	let isServerRunning = false

	async function getServerInfo(): Promise<void> {
		try {
			serverUrl = await window.api.getServerUrl()
			isServerRunning = await window.api.isServerRunning()
		} catch (error) {
			console.error('Failed to get server info:', error)
		}
	}

	getServerInfo()
</script>

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

<style>
	/* Server Information Styles */
	.server-info {
		margin-top: 30px;
		padding: 20px;
		border-radius: 12px;
		background-color: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		max-width: 500px;
		text-align: center;
	}

	.server-info h3 {
		margin: 0 0 15px 0;
		color: var(--ev-c-text-1);
		font-size: 18px;
		font-weight: 600;
	}

	.server-status {
		margin-bottom: 15px;
	}

	.status-indicator {
		display: inline-block;
		padding: 8px 16px;
		border-radius: 20px;
		font-weight: 600;
		font-size: 14px;
	}

	.status-indicator.running {
		background-color: rgba(34, 197, 94, 0.2);
		color: #22c55e;
		border: 1px solid rgba(34, 197, 94, 0.3);
	}

	.status-indicator.stopped {
		background-color: rgba(239, 68, 68, 0.2);
		color: #ef4444;
		border: 1px solid rgba(239, 68, 68, 0.3);
	}

	.server-url {
		margin-bottom: 15px;
	}

	.server-url p {
		margin: 0 0 8px 0;
		color: var(--ev-c-text-2);
		font-size: 14px;
	}

	.server-url a {
		color: #3b82f6;
		text-decoration: none;
		font-weight: 600;
		word-break: break-all;
	}

	.server-url a:hover {
		text-decoration: underline;
	}

	.server-endpoints {
		text-align: left;
	}

	.server-endpoints p {
		margin: 0 0 8px 0;
		color: var(--ev-c-text-2);
		font-size: 14px;
		font-weight: 600;
	}

	.server-endpoints ul {
		margin: 0;
		padding-left: 20px;
		list-style: none;
	}

	.server-endpoints li {
		margin-bottom: 5px;
	}

	.server-endpoints a {
		color: #3b82f6;
		text-decoration: none;
		font-size: 14px;
	}

	.server-endpoints a:hover {
		text-decoration: underline;
	}
</style>
