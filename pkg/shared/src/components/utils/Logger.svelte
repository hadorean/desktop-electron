<script lang="ts">
	import Lifespan, { type Span } from './Lifespan.svelte'

	export let label: string | null = null

	export let input: {
		subscribe: (callback: (value: unknown) => void) => () => void
	}

	export let json: boolean = false

	const init = (span: Span): void => {
		const toLog = (x: unknown) => (!json || typeof x === 'string' ? x : JSON.stringify(x, null, 2))

		span.subscribe(input, value => {
			if (label) {
				console.log(label, toLog(value))
			} else {
				console.log(toLog(value))
			}
		})
	}
</script>

<Lifespan {init} />
