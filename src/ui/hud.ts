import { combatConfig } from '../game/config/combatConfig';
import type { RoundState } from '../game/simulation/types';

export function renderHud(root: HTMLElement, round: RoundState): void {
  const vixHealth = healthPercent(round.fighters.vix.health);
  const carterHealth = healthPercent(round.fighters.carter.health);
  const status = round.winner ? `${round.fighters[round.winner].label} wins` : 'Phase 1 Prototype';
  const restart = round.winner && round.koFreezeMs <= 0 ? 'Press R to restart' : 'H / F1 toggles debug';

  root.innerHTML = `
    <div class="hud">
      <div class="fighter-panel vix">
        <div class="fighter-name">Vix</div>
        <div class="health-shell"><div class="health-fill" style="width:${vixHealth}%"></div></div>
        <div class="state-label">${round.fighters.vix.state} · ${round.fighters.vix.health}</div>
      </div>
      <div class="round-status">
        <strong>${status}</strong>
        <span>${restart}</span>
      </div>
      <div class="fighter-panel carter">
        <div class="fighter-name">Carter</div>
        <div class="health-shell"><div class="health-fill" style="width:${carterHealth}%"></div></div>
        <div class="state-label">${round.fighters.carter.state} · ${round.fighters.carter.health}</div>
      </div>
    </div>
  `;
}

function healthPercent(value: number): number {
  return Math.max(0, Math.min(100, (value / combatConfig.maxHealth) * 100));
}
