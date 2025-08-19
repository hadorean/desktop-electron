// Interpolation helper functions
function lerp(start: number, end: number, progress: number): number {
	return start + (end - start) * progress
}

function easeQuadraticOut(t: number): number {
	return 1 - (1 - t) * (1 - t)
}
