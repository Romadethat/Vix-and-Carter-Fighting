import './style.css';
import { createRoundState } from './game/simulation/round';
import { renderDebugLog } from './ui/debugLog';
import { renderHud } from './ui/hud';

const hudRoot = document.querySelector<HTMLElement>('#hud-root');
const debugRoot = document.querySelector<HTMLElement>('#debug-log');

if (!hudRoot || !debugRoot) {
  throw new Error('Missing app roots');
}

const round = createRoundState();
renderHud(hudRoot, round);
renderDebugLog(debugRoot, round, true);
