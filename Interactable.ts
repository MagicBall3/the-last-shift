import type * as THREE from 'three';

export interface Interactable {
  object: THREE.Object3D;
  /** Подсказка, когда игрок смотрит на объект */
  prompt: string;
  /** Возвращённая строка показывается как сообщение */
  onInteract(): string | void;
}
