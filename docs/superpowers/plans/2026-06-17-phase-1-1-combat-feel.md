# Phase 1.1 Combat Feel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the existing Phase 1 prototype's combat feel, readability, tuning, feedback, and debug proof without adding Phase 2 mechanics or final art.

**Architecture:** Keep the existing separation: pure TypeScript simulation owns combat truth, Phaser renders placeholder feedback, DOM renders HUD/debug logs. Add only config-driven tuning and renderer-facing transient feedback data that reflects simulation events.

**Tech Stack:** Vite, TypeScript, Phaser Canvas renderer, Vitest, Playwright.

---

## File Structure

- Modify `src/game/config/combatConfig.ts`: movement, attack, hit pause, hit flash, block flash, pose, and debug tuning values.
- Modify `src/game/simulation/types.ts`: add fighter feedback fields and optional frame/debug metadata.
- Modify `src/game/simulation/fighters.ts`: initialize feedback fields and expose attack phase helpers.
- Modify `src/game/simulation/round.ts`: tune movement/attacks, update feedback timers, improve hit/block reaction behavior, expose debug values.
- Modify `src/test/round.test.ts`: add tests for feedback timers, block feedback, tuned movement, and hit pause.
- Modify `src/game/render/FightScene.ts`: render attack poses, hit/block flashes, clearer debug readout, and hit pause state.
- Modify `src/ui/hud.ts`: keep compact HUD but show debug-friendly state values already present.
- Modify `tests/phase1.spec.ts`: verify debug overlay still renders and includes richer state text.

---

### Task 1: Simulation Feedback And Tuning Tests

**Files:**
- Modify: `src/test/round.test.ts`

- [ ] **Step 1: Add failing tests for Phase 1.1 feel rules**

Append tests that assert:

```ts
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
```

- [ ] **Step 2: Run tests and confirm red**

Run: `npm.cmd test`

Expected: FAIL because feedback fields and new tuned values are not implemented yet.

---

### Task 2: Config And Simulation Feel

**Files:**
- Modify: `src/game/config/combatConfig.ts`
- Modify: `src/game/simulation/types.ts`
- Modify: `src/game/simulation/fighters.ts`
- Modify: `src/game/simulation/round.ts`

- [ ] **Step 1: Implement config-driven feel values**

Update config values:

```ts
movement: {
  walkSpeed: 240,
  jumpVelocity: -560,
  gravity: 1650,
  maxFallSpeed: 980,
  groundY: 520,
  stageLeft: 40,
  stageRight: 920,
},
hitPauseMs: {
  light: 58,
  heavy: 92,
},
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
}
```

- [ ] **Step 2: Add fighter feedback type fields**

Add to `types.ts`:

```ts
export type FlashKind = 'none' | 'hit' | 'block';

export interface FighterFlash {
  kind: FlashKind;
  remainingMs: number;
}
```

Add to `Fighter`:

```ts
flash: FighterFlash;
lastHitBy: AttackKind | null;
```

- [ ] **Step 3: Initialize feedback fields**

In `createFighter`, initialize:

```ts
flash: { kind: 'none', remainingMs: 0 },
lastHitBy: null,
```

- [ ] **Step 4: Update round simulation**

Make `updateRound` decrement flash timers even during hit pause and KO freeze. On hit, set `flash.kind = 'hit'`, `remainingMs = hitFlashMs`, and `lastHitBy = attack`. On block, set `flash.kind = 'block'`, `remainingMs = blockFlashMs`, and use block knockback scale from config. Use attack-specific hit pause.

- [ ] **Step 5: Run tests**

Run: `npm.cmd test`

Expected: PASS.

- [ ] **Step 6: Commit simulation feel**

```bash
git add src/game/config/combatConfig.ts src/game/simulation src/test/round.test.ts
git commit -m "Tune Phase 1.1 combat feel simulation"
```

---

### Task 3: Visual Combat Feedback And Debug Readout

**Files:**
- Modify: `src/game/render/FightScene.ts`
- Modify: `src/ui/debugLog.ts`
- Modify: `tests/phase1.spec.ts`

- [ ] **Step 1: Render placeholder poses**

Use fighter state to adjust rectangle scale, tint, and vertical offset:

- startup: slight squash/narrow
- active: wider strike pose
- recovery: near-normal with lower alpha
- block: narrower blue/cyan guard
- hitstun: red/white flash with slight squash

- [ ] **Step 2: Render feedback flashes**

When `fighter.flash.kind === 'hit'`, briefly tint the fighter white/red. When `block`, tint cyan and show a small guard spark rectangle near the defender.

- [ ] **Step 3: Improve debug state text**

Show:

```txt
state: lightActive
phase: active 46ms
hp: 92
block: false
hitPause: 58
```

Keep `H` / `F1` as the debug toggle.

- [ ] **Step 4: Update Playwright expectation**

In `tests/phase1.spec.ts`, after toggling debug, verify the page contains `Proof Log` and the canvas exists. Keep screenshot output at `test-results/phase1-arena.png`.

- [ ] **Step 5: Verify**

Run:

```bash
npm.cmd test
npm.cmd run build
npm.cmd run verify:browser
```

Expected: all pass.

- [ ] **Step 6: Commit visual/debug feel**

```bash
git add src/game/render/FightScene.ts src/ui/debugLog.ts tests/phase1.spec.ts
git commit -m "Add Phase 1.1 combat feedback visuals"
```

---

## Completion Gate

Phase 1.1 is complete when:

- Movement is config-driven and tighter than Phase 1.
- Light and heavy attacks have distinct timing and hit pause.
- Hits and blocks produce visible placeholder feedback.
- Hitstun and knockback remain stable.
- Debug overlay shows state, phase, timer, health, block state, and hit pause.
- No new characters, final art, story, AI, multiplayer, controller support, mobile support, combos, cancels, specials, grabs, supers, or parries were added.
- `npm.cmd test`, `npm.cmd run build`, and `npm.cmd run verify:browser` pass.
