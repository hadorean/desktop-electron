import { Tween } from '@tweenjs/tween.js'

export class Tweener {
	private animationFrameId: number | null = null
	private tweens: Tween[] = []

	private animate(time: number): void {
		this.tweens.forEach(tween => tween.update(time))

		if (this.tweens.length !== 0) {
			this.animationFrameId = requestAnimationFrame(time => this.animate(time))
		} else {
			this.animationFrameId = null
		}
	}

	public startTween(tween: Tween): Tween {
		this.tweens.push(tween)
		tween.start()

		if (this.animationFrameId === null) {
			this.animationFrameId = requestAnimationFrame(time => this.animate(time))
		}

		return tween
	}

	public stopTween(tween: Tween | null): null {
		if (!tween) return null
		this.tweens = this.tweens.filter(t => t !== tween)
		tween.stop()
		return null
	}

	public restartTween(previousTween: Tween | null, newTween: Tween): Tween {
		if (previousTween) {
			this.stopTween(previousTween)
		}
		this.startTween(newTween)
		return newTween
	}

	public restart(owner: { tween: Tween | null }, newTween: Tween): void {
		owner.tween = this.restartTween(owner.tween, newTween)
	}

	public stop(owner: { tween: Tween | null }): void {
		owner.tween = this.stopTween(owner.tween)
	}

	public start(owner: { tween: Tween | null }, newTween: Tween): void {
		owner.tween = this.startTween(newTween)
	}

	public dispose(): void {
		this.tweens = []
		this.animationFrameId = null
	}
}
