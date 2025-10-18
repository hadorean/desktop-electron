<script lang="ts">
	import * as ContextMenu from '$lib/components/ui/context-menu/index.js'
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger>Right click</ContextMenu.Trigger>
	<ContextMenu.Content>
		<ContextMenu.Item>Profile</ContextMenu.Item>
		<ContextMenu.Item>Billing</ContextMenu.Item>
		<ContextMenu.Item>Team</ContextMenu.Item>
		<ContextMenu.Item>Subscription</ContextMenu.Item>
	</ContextMenu.Content>
</ContextMenu.Root>
