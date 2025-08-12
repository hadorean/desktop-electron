<script lang="ts">
	export const title: string | null = null
	export const logo: string | null = null

	// Window control functions
	function minimizeWindow(): void {
		window.api.minimizeWindow()
	}

	function maximizeWindow(): void {
		window.api.maximizeWindow()
	}

	function closeWindow(): void {
		window.api.closeWindow()
	}
</script>

<!-- Custom Header Bar -->
<div class="custom-header">
	<div class="header-left">
		{#if logo}
			<img alt="logo" class="header-logo" src={logo} />
		{/if}
		{#if title}
			<span class="app-title">{title}</span>
		{/if}
	</div>
	<div class="header-right">
		<button class="header-button minimize-btn" onclick={minimizeWindow}>
			<span style="font-size: 12px;">─</span>
		</button>
		<button class="header-button maximize-btn" onclick={maximizeWindow}>
			<span style="font-size: 18px; transform: translateY(-1px);">□</span>
		</button>
		<button class="header-button close-btn" onclick={closeWindow}>
			<span style="font-size: 12px; transform: translateY(1px);">✕</span>
		</button>
	</div>
</div>

<style>
	/* Custom Header Styles */
	.custom-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 15px;
		z-index: 9999; /* Higher z-index to prevent white header from showing */
		-webkit-app-region: drag; /* Make header draggable */
		padding: 0.5rem;
		margin-bottom: 1rem;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.header-logo {
		width: 20px;
		height: 20px;
		-webkit-user-drag: none;
	}

	.app-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--ev-c-text-1);
	}

	.header-right {
		display: flex;
		gap: 5px;
		-webkit-app-region: no-drag; /* Make buttons clickable */
	}

	.header-button {
		width: 30px;
		height: 30px;
		border: none;
		background: transparent;
		color: var(--ev-c-text-1);
		border-radius: 5px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 16px;
		font-weight: bold;
		transition:
			background-color 0.2s ease,
			opacity 0.2s ease;
		opacity: 0.5;
	}

	.header-button:hover {
		background: rgba(255, 255, 255, 0.1);
		opacity: 1;
	}

	.close-btn:hover {
		background: rgba(239, 68, 68, 0.8) !important;
		color: white;
	}
</style>
