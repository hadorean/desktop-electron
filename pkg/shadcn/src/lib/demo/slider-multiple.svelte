<script lang="ts">
	import { Slider } from '$lib/components/ui/slider/index.js'
	let value = $state([25, 75])
</script>

<Slider type="multiple" bind:value max={100} step={1} />
