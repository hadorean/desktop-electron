/// <reference types="svelte" />
/// <reference types="vite/client" />
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../preload/index.d.ts" />

declare module '*.svg' {
	const content: string
	export default content
}
