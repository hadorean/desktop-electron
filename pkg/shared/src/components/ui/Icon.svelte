<script lang="ts">
	import { BackArrowIcon, Cog6ToothIcon, WarningCircleIcon, XMarkIcon } from '../../assets/icons'

	export let name: 'warning-circle' | 'x-mark' | 'cog' | 'back-arrow'
	export let size: 'sm' | 'md' | 'lg' = 'md'
	export let className: string = ''

	const icons = {
		'warning-circle': WarningCircleIcon,
		'x-mark': XMarkIcon,
		cog: Cog6ToothIcon,
		'back-arrow': BackArrowIcon
	}

	const sizes = {
		sm: '1rem',
		md: '1.5rem',
		lg: '2rem'
	}

	$: iconSvg = icons[name]
	$: iconSize = sizes[size]
</script>

<div class="icon {className}" style="width: {iconSize}; height: {iconSize};" {...$$restProps}>
	{@html iconSvg}
</div>

<style>
	.icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.icon :global(svg) {
		width: 100%;
		height: 100%;
		stroke: currentColor;
	}
</style>
