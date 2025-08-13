import Root from './button.svelte'

type Variant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
type Size = 'default' | 'sm' | 'lg' | 'icon'

export {
	Root,
	//
	Root as Button,
	type Variant,
	type Size
}
