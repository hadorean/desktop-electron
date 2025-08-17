<script lang="ts">
	import { Slider } from '$lib/components/ui/slider/index.js'
	let value = $state(33)
</script>

<div style="width: 200px;">
	<Slider type="single" bind:value max={100} step={1} />
</div>
