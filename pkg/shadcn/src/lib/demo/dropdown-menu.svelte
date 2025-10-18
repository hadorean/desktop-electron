<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js'
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Group>
			<DropdownMenu.GroupHeading>My Account</DropdownMenu.GroupHeading>
			<DropdownMenu.Separator />
			<DropdownMenu.Item>Profile</DropdownMenu.Item>
			<DropdownMenu.Item>Billing</DropdownMenu.Item>
			<DropdownMenu.Item>Team</DropdownMenu.Item>
			<DropdownMenu.Item>Subscription</DropdownMenu.Item>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
