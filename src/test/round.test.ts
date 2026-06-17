import { describe, expect, it } from 'vitest';
import { combatConfig } from '../game/config/combatConfig';
import { getHurtbox } from '../game/simulation/fighters';
import { createRoundState, updateRound } from '../game/simulation/round';

const none = { left: false, right: false, jump: false, crouch: false, block: false, light: false, heavy: false };

describe('round simulation', () => {
  it('uses attack timing before damage applies', () => {
    const round = createRoundState();
    updateRound(round, 16, { vix: { ...none, light: true }, carter: none });
    expect(round.fighters.vix.state).toBe('lightStartup');
    expect(round.fighters.carter.health).toBe(100);

    updateRound(round, 90, { vix: none, carter: none });
    expect(round.fighters.vix.state).toBe('lightActive');
  });

  it('applies one hit per attack activation', () => {
    const round = createRoundState();
    round.fighters.vix.x = 420;
    round.fighters.carter.x = 462;
    updateRound(round, 16, { vix: { ...none, light: true }, carter: none });
    updateRound(round, 90, { vix: none, carter: none });
    const firstHealth = round.fighters.carter.health;
    updateRound(round, 20, { vix: none, carter: none });
    expect(firstHealth).toBe(92);
    expect(round.fighters.carter.health).toBe(92);
  });

  it('reduces damage when a valid block faces the attacker', () => {
    const round = createRoundState();
    round.fighters.vix.x = 420;
    round.fighters.carter.x = 462;
    round.fighters.carter.facing = -1;
    updateRound(round, 16, { vix: { ...none, heavy: true }, carter: { ...none, block: true } });
    updateRound(round, 180, { vix: none, carter: { ...none, block: true } });
    expect(round.fighters.carter.health).toBe(95);
    expect(round.logs.at(-1)?.kind).toBe('BLOCK');
  });

  it('enters ko freeze before restart is accepted', () => {
    const round = createRoundState();
    round.fighters.carter.health = 8;
    round.fighters.vix.x = 420;
    round.fighters.carter.x = 462;
    updateRound(round, 16, { vix: { ...none, light: true }, carter: none });
    updateRound(round, 90, { vix: none, carter: none });
    expect(round.winner).toBe('vix');
    expect(round.koFreezeMs).toBeGreaterThan(0);
    expect(round.logs.some((entry) => entry.kind === 'KO')).toBe(true);
  });

  it('buffers an attack during recovery and starts it when actionable', () => {
    const round = createRoundState();
    updateRound(round, 16, { vix: { ...none, light: true }, carter: none });
    updateRound(round, 90, { vix: none, carter: none });
    updateRound(round, 90, { vix: none, carter: none });
    expect(round.fighters.vix.state).toBe('lightRecovery');

    updateRound(round, 120, { vix: { ...none, heavy: true }, carter: none });
    updateRound(round, 70, { vix: none, carter: none });
    expect(round.fighters.vix.state).toBe('heavyStartup');
  });

  it('uses tuned movement values for snappier ground and jump feel', () => {
    const round = createRoundState();
    const startX = round.fighters.vix.x;

    updateRound(round, 100, { vix: { ...none, right: true }, carter: none });
    expect(round.fighters.vix.x - startX).toBeCloseTo(24, 1);

    updateRound(round, 16, { vix: { ...none, jump: true }, carter: none });
    expect(round.fighters.vix.grounded).toBe(false);
    expect(round.fighters.vix.vy).toBeLessThan(-500);
  });

  it('sets visible hit feedback and differentiated hit pause on successful hits', () => {
    const round = createRoundState();
    round.fighters.vix.x = 420;
    round.fighters.carter.x = 462;

    updateRound(round, 16, { vix: { ...none, heavy: true }, carter: none });
    updateRound(round, 170, { vix: none, carter: none });

    expect(round.hitPauseMs).toBe(92);
    expect(round.fighters.carter.flash.kind).toBe('hit');
    expect(round.fighters.carter.flash.remainingMs).toBeGreaterThan(0);
    expect(round.fighters.carter.state).toBe('hitstun');
  });

  it('sets visible block feedback and reduced knockback on blocked hits', () => {
    const round = createRoundState();
    round.fighters.vix.x = 420;
    round.fighters.carter.x = 462;

    updateRound(round, 16, { vix: { ...none, light: true }, carter: { ...none, block: true } });
    updateRound(round, 70, { vix: none, carter: { ...none, block: true } });

    expect(round.fighters.carter.flash.kind).toBe('block');
    expect(round.fighters.carter.health).toBe(98);
    expect(Math.abs(round.fighters.carter.vx)).toBeLessThan(80);
  });

  it('uses down as crouch instead of block', () => {
    const round = createRoundState();

    updateRound(round, 16, { vix: { ...none, crouch: true }, carter: none });

    expect(round.fighters.vix.state).toBe('crouch');
    expect(round.fighters.vix.vx).toBe(0);
  });

  it('requires the dedicated block action to block attacks', () => {
    const round = createRoundState();
    round.fighters.vix.x = 420;
    round.fighters.carter.x = 462;

    updateRound(round, 16, { vix: { ...none, light: true }, carter: { ...none, crouch: true } });
    updateRound(round, 70, { vix: none, carter: { ...none, crouch: true } });
    expect(round.fighters.carter.health).toBe(92);
    expect(round.logs.at(-1)?.kind).toBe('HIT');

    const blockingRound = createRoundState();
    blockingRound.fighters.vix.x = 420;
    blockingRound.fighters.carter.x = 462;
    updateRound(blockingRound, 16, { vix: { ...none, light: true }, carter: { ...none, block: true } });
    updateRound(blockingRound, 70, { vix: none, carter: { ...none, block: true } });
    expect(blockingRound.fighters.carter.health).toBe(98);
    expect(blockingRound.logs.at(-1)?.kind).toBe('BLOCK');
  });

  it('prevents jumping while crouch is held and exits crouch when released', () => {
    const round = createRoundState();

    updateRound(round, 16, { vix: { ...none, crouch: true, jump: true }, carter: none });
    expect(round.fighters.vix.state).toBe('crouch');
    expect(round.fighters.vix.grounded).toBe(true);
    expect(round.fighters.vix.vy).toBe(0);

    updateRound(round, 16, { vix: none, carter: none });
    expect(round.fighters.vix.state).toBe('idle');

    updateRound(round, 16, { vix: { ...none, right: true }, carter: none });
    expect(round.fighters.vix.state).toBe('walk');
  });

  it('uses a shorter crouching hurtbox without changing floor position', () => {
    const round = createRoundState();
    const standing = getHurtbox(round.fighters.vix);

    updateRound(round, 16, { vix: { ...none, crouch: true }, carter: none });
    const crouching = getHurtbox(round.fighters.vix);

    expect(crouching.height).toBeLessThan(standing.height);
    expect(crouching.y + crouching.height).toBe(standing.y + standing.height);
    expect(round.fighters.vix.y).toBe(combatConfig.movement.groundY);
  });

  it('tags current attacks as mid height', () => {
    expect(combatConfig.attacks.light.height).toBe('mid');
    expect(combatConfig.attacks.heavy.height).toBe('mid');
  });

  it('tracks standing and crouching block modes for mid attacks', () => {
    const standingRound = createRoundState();
    standingRound.fighters.vix.x = 420;
    standingRound.fighters.carter.x = 462;
    updateRound(standingRound, 16, { vix: { ...none, light: true }, carter: { ...none, block: true } });
    updateRound(standingRound, 70, { vix: none, carter: { ...none, block: true } });
    expect(standingRound.fighters.carter.blockMode).toBe('standing');
    expect(standingRound.logs.at(-1)?.kind).toBe('BLOCK');

    const crouchingRound = createRoundState();
    crouchingRound.fighters.vix.x = 420;
    crouchingRound.fighters.carter.x = 462;
    updateRound(crouchingRound, 16, { vix: { ...none, light: true }, carter: { ...none, crouch: true, block: true } });
    updateRound(crouchingRound, 70, { vix: none, carter: { ...none, crouch: true, block: true } });
    expect(crouchingRound.fighters.carter.blockMode).toBe('crouching');
    expect(crouchingRound.logs.at(-1)?.kind).toBe('BLOCK');
  });
});
