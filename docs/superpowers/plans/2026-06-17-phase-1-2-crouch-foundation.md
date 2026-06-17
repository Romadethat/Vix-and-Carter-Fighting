# Phase 1.2 Crouch Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make crouch a real combat-engine posture with reduced hurtbox, attack height tags, block mode structure, and debug proof before Phase 2 character differentiation.

**Architecture:** Keep gameplay truth in pure simulation modules. Phaser renders placeholder posture and debug boxes from simulation state. DOM HUD stays compact. No new characters, final art, specials, combos, grabs, AI, multiplayer, controllers, mobile, or high/low mixup rules.

**Tech Stack:** TypeScript, Phaser, Vite, Vitest, Playwright.

---

## Task 1: Simulation Tests

**Files:**
- Modify: `src/test/round.test.ts`

- [ ] Add failing tests that prove:
  - holding crouch enters `crouch` and prevents jump
  - releasing crouch returns to idle or walk
  - crouch hurtbox is shorter than standing hurtbox
  - light and heavy are tagged `mid`
  - standing block and crouch block both block mid attacks

- [ ] Run `npm.cmd test` and confirm red.

## Task 2: Engine Foundation

**Files:**
- Modify: `src/game/config/combatConfig.ts`
- Modify: `src/game/simulation/types.ts`
- Modify: `src/game/simulation/fighters.ts`
- Modify: `src/game/simulation/round.ts`

- [ ] Add `AttackHeight = 'high' | 'mid' | 'low' | 'overhead'`.
- [ ] Add `BlockMode = 'none' | 'standing' | 'crouching'`.
- [ ] Add `height: 'mid'` to light and heavy attack config.
- [ ] Split hurtboxes into standing and crouching config values.
- [ ] Track `blockMode` and use it for current mid-block behavior.
- [ ] Keep down/crouch from becoming block by itself.
- [ ] Prevent jump while crouch is held.
- [ ] Keep crouch movement locked for now.
- [ ] Run `npm.cmd test` and `npm.cmd run build`.
- [ ] Commit as `Add Phase 1.2 crouch combat foundation`.

## Task 3: Debug And Visual Proof

**Files:**
- Modify: `src/game/render/FightScene.ts`
- Modify: `tests/phase1.spec.ts`

- [ ] Show crouch hurtbox in debug overlay.
- [ ] Show debug text for grounded, crouching, block mode, hurtbox type, attack height, health, hit pause, and state timer.
- [ ] Keep crouch placeholder visibly squashed/lowered.
- [ ] Verify browser screenshot still shows arena, fighters, HUD, crouch-ready debug overlay.
- [ ] Run `npm.cmd test`, `npm.cmd run build`, and `npm.cmd run verify:browser`.
- [ ] Commit as `Show Phase 1.2 crouch debug proof`.

## Completion Gate

- Down creates a real crouch posture.
- Crouch lowers the hurtbox.
- Holding crouch prevents jump.
- Crouch movement is locked.
- Light and heavy are tagged `mid`.
- Standing block and crouch block both block mid attacks.
- Debug overlay shows crouch state, block mode, hurtbox type, and attack height.
- No Phase 2 character differentiation or advanced mechanics are added.
- Tests, build, and browser verification pass.
