import type { RoundState } from '../game/simulation/types';

export function renderDebugLog(root: HTMLElement, round: RoundState, visible: boolean): void {
  root.classList.toggle('visible', visible);
  const recent = round.logs.slice(-8).map((entry) => `<div>${entry.message}</div>`).join('');
  const pause = round.hitPauseMs > 0 ? `<div>HIT PAUSE ACTIVE: ${Math.ceil(round.hitPauseMs)}ms</div>` : '';
  root.innerHTML = visible ? `<strong>Proof Log</strong>${pause}${recent || '<div>No combat events yet</div>'}` : '';
}
