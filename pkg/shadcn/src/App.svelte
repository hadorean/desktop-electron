<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import { Switch } from '$lib/components/ui/switch/index.js'
	import { ThemeToggle } from '$lib/components/ui/theme-toggle'
	import { Demo } from '$lib/demo'
	import { ModeWatcher } from 'mode-watcher'
</script>

<main>
	<article>
		<ThemeToggle />
		<Button onclick={() => console.log('clicked')}>Click me</Button>
		<Switch />
		<Demo.Select />
	</article>
	<article>
		<Demo.Card />
	</article>
	<article>
		<Demo.ContextMenu />
		<Demo.DropdownMenu />
		<Demo.HoverCard />
	</article>
	<article>
		<Demo.Slider />
		<Demo.SliderMultiple />
	</article>
	<article>
		<Demo.Breadcrumb />
	</article>
	<article><Demo.Checkbox /></article>
</main>

<ModeWatcher />

<style>
	main {
		display: flex;
		flex-wrap: wrap;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		padding: 5rem;
		gap: 2rem;
	}

	article {
		width: 100%;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: flex-start;
		gap: 0.5rem;
	}
</style>
