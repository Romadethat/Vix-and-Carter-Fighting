import { combatConfig } from '../config/combatConfig';
import { centeredRect } from './geometry';
import type { AttackKind, Fighter, FighterId, Rect } from './types';

export function createFighter(id: FighterId): Fighter {
  const isVix = id === 'vix';

  return {
    id,
    label: isVix ? 'Vix' : 'Carter',
    x: isVix ? 280 : 680,
    y: combatConfig.movement.groundY,
    vx: 0,
    vy: 0,
    facing: isVix ? 1 : -1,
    health: combatConfig.maxHealth,
    grounded: true,
    state: 'idle',
    stateTimerMs: 0,
    activeAttack: null,
    hasHitThisAttack: false,
    bufferedAttack: null,
    bufferedAttackMs: 0,
    flash: { kind: 'none', remainingMs: 0 },
    lastHitBy: null,
    tint: isVix ? 0xff7a3d : 0x4c8dff,
  };
}

export function getCollisionBox(fighter: Fighter): Rect {
  return centeredRect(fighter.x, fighter.y, combatConfig.boxes.collision.width, combatConfig.boxes.collision.height);
}

export function getHurtbox(fighter: Fighter): Rect {
  return centeredRect(fighter.x, fighter.y, combatConfig.boxes.hurt.width, combatConfig.boxes.hurt.height);
}

export function getAttackHitbox(fighter: Fighter): Rect | null {
  const attack = getCurrentAttackKind(fighter);

  if (!attack) {
    return null;
  }

  const config = combatConfig.attacks[attack];
  const width = config.range;
  const height = combatConfig.boxes.attackHeight;
  const x =
    fighter.facing === 1
      ? fighter.x + combatConfig.boxes.collision.width / 2
      : fighter.x - combatConfig.boxes.collision.width / 2 - width;

  return {
    x,
    y: fighter.y - combatConfig.boxes.collision.height + 20,
    width,
    height,
  };
}

export function getCurrentAttackKind(fighter: Fighter): AttackKind | null {
  if (fighter.state === 'lightActive') {
    return 'light';
  }

  if (fighter.state === 'heavyActive') {
    return 'heavy';
  }

  return null;
}

export function getAttackPhase(fighter: Fighter): 'startup' | 'active' | 'recovery' | null {
  if (fighter.state === 'lightStartup' || fighter.state === 'heavyStartup') {
    return 'startup';
  }

  if (fighter.state === 'lightActive' || fighter.state === 'heavyActive') {
    return 'active';
  }

  if (fighter.state === 'lightRecovery' || fighter.state === 'heavyRecovery') {
    return 'recovery';
  }

  return null;
}

export function isAttacking(fighter: Fighter): boolean {
  return fighter.state.startsWith('light') || fighter.state.startsWith('heavy');
}

export function isActionLocked(fighter: Fighter): boolean {
  return isAttacking(fighter) || fighter.state === 'hitstun' || fighter.state === 'ko';
}
