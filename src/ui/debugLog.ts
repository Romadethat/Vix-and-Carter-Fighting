import type { RoundState } from '../game/simulation/types';

export function renderDebugLog(root: HTMLElement, round: RoundState, visible: boolean): void {
  root.classList.toggle('visible', visible);
  const recent = round.logs.slice(-8).map((entry) => `<div>${entry.message}</div>`).join('');
  root.innerHTML = visible ? `<strong>Proof Log</strong>${recent || '<div>No combat events yet</div>'}` : '';
}
