<script lang="ts">
	import Lifespan, { type Scope } from './Lifespan.svelte'

	export let label: string | null = null

	export let input: {
		subscribe: (callback: (value: unknown) => void) => () => void
	}

	export let json: boolean = false

	const init = (s: Scope): void => {
		const toLog = (x: unknown) => (!json || typeof x === 'string' ? x : JSON.stringify(x, null, 2))

		s.subscribe(input, value => {
			if (label) {
				console.log(label, toLog(value))
			} else {
				console.log(toLog(value))
			}
		})
	}
</script>

<Lifespan {init} />
