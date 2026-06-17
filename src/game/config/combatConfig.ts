import type { AttackConfig } from '../simulation/types';

export const combatConfig = {
  maxHealth: 100,
  movement: {
    walkSpeed: 220,
    jumpVelocity: -520,
    gravity: 1400,
    maxFallSpeed: 900,
    groundY: 520,
    stageLeft: 40,
    stageRight: 920,
  },
  inputBufferMs: 100,
  hitPauseMs: 70,
  koFreezeMs: 900,
  camera: {
    staticArena: true,
    followMidpoint: false,
  },
  boxes: {
    collision: { width: 42, height: 108 },
    hurt: { width: 48, height: 112 },
    attackHeight: 54,
  },
  attacks: {
    light: {
      startupMs: 90,
      activeMs: 90,
      recoveryMs: 180,
      damage: 8,
      blockDamage: 2,
      range: 42,
      knockback: 120,
      hitstunMs: 220,
    },
    heavy: {
      startupMs: 180,
      activeMs: 120,
      recoveryMs: 320,
      damage: 16,
      blockDamage: 5,
      range: 62,
      knockback: 220,
      hitstunMs: 320,
    },
  } satisfies Record<string, AttackConfig>,
} as const;
