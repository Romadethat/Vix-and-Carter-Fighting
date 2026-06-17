import type { FighterActions, FighterId } from '../simulation/types';

const emptyActions = (): FighterActions => ({
  left: false,
  right: false,
  jump: false,
  block: false,
  light: false,
  heavy: false,
});

export class InputMapper {
  private readonly pressed = new Set<string>();

  bind(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  getActions(): Record<FighterId, FighterActions> {
    return {
      vix: {
        left: this.pressed.has('KeyA'),
        right: this.pressed.has('KeyD'),
        jump: this.pressed.has('KeyW'),
        block: this.pressed.has('KeyS'),
        light: this.pressed.has('KeyF'),
        heavy: this.pressed.has('KeyG'),
      },
      carter: {
        left: this.pressed.has('ArrowLeft'),
        right: this.pressed.has('ArrowRight'),
        jump: this.pressed.has('ArrowUp'),
        block: this.pressed.has('ArrowDown'),
        light: this.pressed.has('KeyK'),
        heavy: this.pressed.has('KeyL'),
      },
    };
  }

  wantsRestart(): boolean {
    return this.pressed.has('KeyR');
  }

  wantsDebugToggle(): boolean {
    return this.pressed.has('KeyH') || this.pressed.has('F1');
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'F1'].includes(event.code)) {
      event.preventDefault();
    }

    this.pressed.add(event.code);
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.pressed.delete(event.code);
  };
}

export function createEmptyActionRecord(): Record<FighterId, FighterActions> {
  return {
    vix: emptyActions(),
    carter: emptyActions(),
  };
}
