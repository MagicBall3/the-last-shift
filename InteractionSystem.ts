import * as THREE from 'three';
import type { InputManager } from '../controls/InputManager';
import { CONFIG } from '../core/config';
import type { GameEvents, GameModule } from '../core/types';
import type { Interactable } from './Interactable';

/** Луч из центра экрана: находит интерактивный объект и обрабатывает нажатие «действие». */
export class InteractionSystem implements GameModule {
  private readonly raycaster = new THREE.Raycaster();
  private readonly center = new THREE.Vector2(0, 0);
  private readonly byObject = new Map<THREE.Object3D, Interactable>();
  private readonly targets: THREE.Object3D[];
  private focused: Interactable | null = null;

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    interactables: readonly Interactable[],
    private readonly input: InputManager,
    private readonly events: Pick<GameEvents, 'onPrompt' | 'onMessage'>,
  ) {
    for (const item of interactables) this.byObject.set(item.object, item);
    this.targets = interactables.map((item) => item.object);
    this.raycaster.far = CONFIG.interaction.maxDistance;
  }

  update(): void {
    this.raycaster.setFromCamera(this.center, this.camera);
    const hits = this.raycaster.intersectObjects(this.targets, true);

    let found: Interactable | null = null;
    if (hits.length > 0) {
      let node: THREE.Object3D | null = hits[0].object;
      while (node && !found) {
        found = this.byObject.get(node) ?? null;
        node = node.parent;
      }
    }

    if (found !== this.focused) {
      this.focused = found;
      this.events.onPrompt(found ? found.prompt : null);
    }

    if (this.focused && this.input.frame.interact) {
      const message = this.focused.onInteract();
      if (message) this.events.onMessage(message);
    }
  }

  dispose(): void {}
}
