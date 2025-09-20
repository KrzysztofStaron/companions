import * as THREE from "three";

export interface AnimationClipEntry {
	name: string;
	clip: THREE.AnimationClip;
	duration: number;
	path: string;
}

export interface AnimationControllerOptions {
	crossFadeMs?: number;
	idleLoop?: boolean;
	clampWhenFinished?: boolean;
}

export type OnFinished = () => void;

export class AnimationController {
	private mixer: THREE.AnimationMixer;
	private actionsByName: Map<string, THREE.AnimationAction> = new Map();
	private currentAction: THREE.AnimationAction | null = null;
	private pendingFinishCb: OnFinished | null = null;
	private isDisposed = false;

	private crossFadeSeconds: number;
	private clampWhenFinished: boolean;
	private idleLoop: boolean;

	constructor(root: THREE.Object3D, clips: AnimationClipEntry[], opts: AnimationControllerOptions = {}) {
		this.mixer = new THREE.AnimationMixer(root);
		this.crossFadeSeconds = (opts.crossFadeMs ?? 400) / 1000;
		this.clampWhenFinished = opts.clampWhenFinished ?? true;
		this.idleLoop = opts.idleLoop ?? true;

		for (const entry of clips) {
			const action = this.mixer.clipAction(entry.clip);
			action.enabled = true;
			action.clampWhenFinished = this.clampWhenFinished;
			this.actionsByName.set(entry.name, action);
		}

		this.mixer.addEventListener("finished", () => {
			if (this.pendingFinishCb) {
				const cb = this.pendingFinishCb;
				this.pendingFinishCb = null;
				cb();
			}
		});
	}

	update(deltaSeconds: number) {
		if (!this.isDisposed) {
			this.mixer.update(deltaSeconds);
		}
	}

	dispose() {
		if (this.isDisposed) return;
		this.mixer.stopAllAction();
		this.actionsByName.clear();
		this.currentAction = null;
		this.pendingFinishCb = null;
		this.isDisposed = true;
	}

	getCurrentName(): string | null {
		for (const [name, action] of this.actionsByName) {
			if (action === this.currentAction) return name;
		}
		return null;
	}

	private getAction(name: string): THREE.AnimationAction | null {
		return this.actionsByName.get(name) ?? null;
	}

	play(name: string, loop: THREE.AnimationAction["loop"] = THREE.LoopRepeat, repetitions: number = Infinity, onFinished?: OnFinished) {
		const next = this.getAction(name);
		if (!next) return;

		next.reset();
		next.setLoop(loop, repetitions);
		next.clampWhenFinished = this.clampWhenFinished;

		if (!this.currentAction) {
			next.fadeIn(this.crossFadeSeconds).play();
			this.currentAction = next;
			this.pendingFinishCb = onFinished ?? null;
			return;
		}

		if (this.currentAction === next) {
			// Already playing; ensure it's running
			next.play();
			this.pendingFinishCb = onFinished ?? null;
			return;
		}

		this.currentAction.crossFadeTo(next, this.crossFadeSeconds, false);
		next.play();
		this.currentAction = next;
		this.pendingFinishCb = onFinished ?? null;
	}

	playOnce(name: string, onFinished?: OnFinished) {
		this.play(name, THREE.LoopOnce, 1, onFinished);
	}

	stop() {
		this.mixer.stopAllAction();
		this.currentAction = null;
		this.pendingFinishCb = null;
	}
}





