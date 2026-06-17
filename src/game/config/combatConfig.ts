import type { AttackConfig } from '../simulation/types';

export const combatConfig = {
  maxHealth: 100,
  movement: {
    walkSpeed: 240,
    jumpVelocity: -560,
    gravity: 1650,
    maxFallSpeed: 980,
    groundY: 520,
    stageLeft: 40,
    stageRight: 920,
  },
  inputBufferMs: 100,
  hitPauseMs: {
    light: 58,
    heavy: 92,
  },
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
      startupMs: 70,
      activeMs: 85,
      recoveryMs: 170,
      damage: 8,
      blockDamage: 2,
      range: 42,
      knockback: 120,
      hitstunMs: 220,
    },
    heavy: {
      startupMs: 170,
      activeMs: 120,
      recoveryMs: 340,
      damage: 16,
      blockDamage: 5,
      range: 62,
      knockback: 220,
      hitstunMs: 320,
    },
  } satisfies Record<string, AttackConfig>,
  feedback: {
    hitFlashMs: 140,
    blockFlashMs: 110,
    lightHitLift: -70,
    heavyHitLift: -120,
    blockKnockbackScale: 0.28,
  },
  poses: {
    startupScaleX: 0.9,
    activeScaleX: 1.18,
    recoveryScaleX: 1.02,
    hitstunScaleY: 0.92,
    blockScaleX: 0.86,
  },
} as const;
