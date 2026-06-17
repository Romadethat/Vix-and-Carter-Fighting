import { combatConfig } from '../config/combatConfig';
import { intersects, isFacingAttacker } from './geometry';
import { createFighter, getAttackHitbox, getCurrentAttackKind, getHurtbox, isActionLocked, isAttacking } from './fighters';
import type { AttackKind, Fighter, FighterActions, FighterId, FighterState, RoundState } from './types';

const fighterIds: FighterId[] = ['vix', 'carter'];

export function createRoundState(): RoundState {
  return {
    fighters: {
      vix: createFighter('vix'),
      carter: createFighter('carter'),
    },
    winner: null,
    hitPauseMs: 0,
    koFreezeMs: 0,
    elapsedMs: 0,
    logs: [],
  };
}

export function updateRound(round: RoundState, deltaMs: number, input: Record<FighterId, FighterActions>): void {
  updateFlashTimers(round, deltaMs);

  if (round.winner) {
    round.koFreezeMs = Math.max(0, round.koFreezeMs - deltaMs);
    return;
  }

  if (round.hitPauseMs > 0) {
    round.hitPauseMs = Math.max(0, round.hitPauseMs - deltaMs);
    return;
  }

  round.elapsedMs += deltaMs;
  updateFacing(round);

  for (const id of fighterIds) {
    updateInputBuffer(round.fighters[id], input[id], deltaMs);
  }

  for (const id of fighterIds) {
    updateFighter(round.fighters[id], input[id], deltaMs);
  }

  resolveBodyPush(round.fighters.vix, round.fighters.carter);
  resolveHits(round);
}

function updateFlashTimers(round: RoundState, deltaMs: number): void {
  for (const id of fighterIds) {
    const flash = round.fighters[id].flash;

    if (flash.remainingMs <= 0) {
      flash.kind = 'none';
      continue;
    }

    flash.remainingMs = Math.max(0, flash.remainingMs - deltaMs);

    if (flash.remainingMs === 0) {
      flash.kind = 'none';
    }
  }
}

function updateFacing(round: RoundState): void {
  const vix = round.fighters.vix;
  const carter = round.fighters.carter;

  if (!isAttacking(vix) && vix.state !== 'hitstun' && vix.state !== 'ko') {
    vix.facing = vix.x <= carter.x ? 1 : -1;
  }

  if (!isAttacking(carter) && carter.state !== 'hitstun' && carter.state !== 'ko') {
    carter.facing = carter.x <= vix.x ? 1 : -1;
  }
}

function updateInputBuffer(fighter: Fighter, actions: FighterActions, deltaMs: number): void {
  if (actions.light) {
    fighter.bufferedAttack = 'light';
    fighter.bufferedAttackMs = combatConfig.inputBufferMs;
    return;
  }

  if (actions.heavy) {
    fighter.bufferedAttack = 'heavy';
    fighter.bufferedAttackMs = combatConfig.inputBufferMs;
    return;
  }

  if (fighter.bufferedAttackMs <= 0) {
    return;
  }

  fighter.bufferedAttackMs = Math.max(0, fighter.bufferedAttackMs - deltaMs);

  if (fighter.bufferedAttackMs === 0) {
    fighter.bufferedAttack = null;
  }
}

function updateFighter(fighter: Fighter, actions: FighterActions, deltaMs: number): void {
  if (fighter.state === 'ko') {
    return;
  }

  fighter.stateTimerMs += deltaMs;

  if (advanceTimedState(fighter)) {
    return;
  }

  applyGravity(fighter, deltaMs);

  if (isActionLocked(fighter)) {
    fighter.x = clampStage(fighter.x + fighter.vx * (deltaMs / 1000));
    return;
  }

  const bufferedAttack = fighter.bufferedAttackMs > 0 ? fighter.bufferedAttack : null;

  if (bufferedAttack) {
    startAttack(fighter, bufferedAttack);
    return;
  }

  if (actions.block && fighter.grounded) {
    fighter.vx = 0;
    fighter.state = 'block';
    fighter.stateTimerMs = 0;
    return;
  }

  if (actions.jump && fighter.grounded) {
    fighter.grounded = false;
    fighter.vy = combatConfig.movement.jumpVelocity;
    fighter.state = 'jump';
    fighter.stateTimerMs = 0;
  }

  const direction = Number(actions.right) - Number(actions.left);
  fighter.vx = direction * combatConfig.movement.walkSpeed;
  fighter.x = clampStage(fighter.x + fighter.vx * (deltaMs / 1000));

  if (!fighter.grounded) {
    fighter.state = fighter.vy < 0 ? 'jump' : 'fall';
  } else if (direction !== 0) {
    fighter.state = 'walk';
  } else {
    fighter.state = 'idle';
  }
}

function applyGravity(fighter: Fighter, deltaMs: number): void {
  if (fighter.grounded) {
    return;
  }

  fighter.vy = Math.min(combatConfig.movement.maxFallSpeed, fighter.vy + combatConfig.movement.gravity * (deltaMs / 1000));
  fighter.y += fighter.vy * (deltaMs / 1000);

  if (fighter.y >= combatConfig.movement.groundY) {
    fighter.y = combatConfig.movement.groundY;
    fighter.vy = 0;
    fighter.grounded = true;
  }
}

function advanceTimedState(fighter: Fighter): boolean {
  if (fighter.state === 'hitstun') {
    if (fighter.stateTimerMs >= 0) {
      fighter.state = fighter.grounded ? 'idle' : 'fall';
      fighter.stateTimerMs = 0;
      return false;
    }

    return true;
  }

  const attack = fighter.activeAttack;

  if (!attack) {
    return false;
  }

  const config = combatConfig.attacks[attack];

  if (fighter.state === attackState(attack, 'Startup') && fighter.stateTimerMs >= config.startupMs) {
    fighter.state = attackState(attack, 'Active');
    fighter.stateTimerMs = 0;
    return true;
  }

  if (fighter.state === attackState(attack, 'Active') && fighter.stateTimerMs >= config.activeMs) {
    fighter.state = attackState(attack, 'Recovery');
    fighter.stateTimerMs = 0;
    return true;
  }

  if (fighter.state === attackState(attack, 'Recovery') && fighter.stateTimerMs >= config.recoveryMs) {
    fighter.state = 'idle';
    fighter.stateTimerMs = 0;
    fighter.activeAttack = null;
    fighter.hasHitThisAttack = false;
    return false;
  }

  return true;
}

function startAttack(fighter: Fighter, attack: AttackKind): void {
  fighter.activeAttack = attack;
  fighter.hasHitThisAttack = false;
  fighter.bufferedAttack = null;
  fighter.bufferedAttackMs = 0;
  fighter.vx = 0;
  fighter.state = attack === 'light' ? 'lightStartup' : 'heavyStartup';
  fighter.stateTimerMs = 0;
}

function attackState(attack: AttackKind, phase: 'Startup' | 'Active' | 'Recovery'): FighterState {
  return `${attack}${phase}` as FighterState;
}

function resolveBodyPush(a: Fighter, b: Fighter): void {
  const minDistance = combatConfig.boxes.collision.width;
  const overlap = minDistance - Math.abs(a.x - b.x);

  if (overlap <= 0) {
    return;
  }

  const push = overlap / 2;

  if (a.x <= b.x) {
    a.x = clampStage(a.x - push);
    b.x = clampStage(b.x + push);
  } else {
    a.x = clampStage(a.x + push);
    b.x = clampStage(b.x - push);
  }
}

function resolveHits(round: RoundState): void {
  for (const attackerId of fighterIds) {
    const defenderId: FighterId = attackerId === 'vix' ? 'carter' : 'vix';
    const attacker = round.fighters[attackerId];
    const defender = round.fighters[defenderId];
    const attack = getCurrentAttackKind(attacker);
    const hitbox = getAttackHitbox(attacker);

    if (!attack || !hitbox || attacker.hasHitThisAttack || defender.state === 'ko') {
      continue;
    }

    if (!intersects(hitbox, getHurtbox(defender))) {
      continue;
    }

    applyHit(round, attacker, defender, attack);
  }
}

function applyHit(round: RoundState, attacker: Fighter, defender: Fighter, attack: AttackKind): void {
  const config = combatConfig.attacks[attack];
  const blocked = canBlock(defender, attacker);
  const damage = blocked ? config.blockDamage : config.damage;
  defender.health = Math.max(0, defender.health - damage);
  defender.vx = attacker.facing * config.knockback * (blocked ? combatConfig.feedback.blockKnockbackScale : 1);
  defender.vy = blocked ? 0 : attack === 'heavy' ? combatConfig.feedback.heavyHitLift : combatConfig.feedback.lightHitLift;
  defender.lastHitBy = attack;
  attacker.hasHitThisAttack = true;
  round.hitPauseMs = combatConfig.hitPauseMs[attack];

  if (blocked) {
    defender.flash = { kind: 'block', remainingMs: combatConfig.feedback.blockFlashMs };
    round.logs.push({
      kind: 'BLOCK',
      message: `BLOCK: ${defender.label} blocked ${attacker.label} ${attack} | damage=${damage} | ${defender.id}Health=${defender.health}`,
    });
  } else {
    defender.flash = { kind: 'hit', remainingMs: combatConfig.feedback.hitFlashMs };
    defender.state = 'hitstun';
    defender.stateTimerMs = -config.hitstunMs;
    round.logs.push({
      kind: 'HIT',
      message: `HIT: ${attacker.label} ${attack} -> ${defender.label} | blocked=false | damage=${damage} | ${defender.id}Health=${defender.health}`,
    });
  }

  if (defender.health <= 0) {
    defender.state = 'ko';
    round.winner = attacker.id;
    round.koFreezeMs = combatConfig.koFreezeMs;
    round.logs.push({
      kind: 'KO',
      message: `KO: ${defender.label} defeated by ${attacker.label} ${attack}`,
    });
  }
}

function canBlock(defender: Fighter, attacker: Fighter): boolean {
  return (
    defender.state === 'block' &&
    !isAttacking(defender) &&
    isFacingAttacker(defender.facing, defender.x, attacker.x)
  );
}

function clampStage(x: number): number {
  return Math.max(combatConfig.movement.stageLeft, Math.min(combatConfig.movement.stageRight, x));
}
