# Vix and Carter Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Phase 1 playable Vix vs Carter 2D fighting prototype with deterministic combat state, tunable config, debug overlay, proof logs, and local browser verification.

**Architecture:** Use a Vite + TypeScript + Phaser app where Phaser owns rendering and input polling, while gameplay rules live in pure TypeScript simulation modules. DOM overlays handle health/status UI, and debug drawing/proof logs expose combat internals for verification.

**Tech Stack:** Vite, TypeScript, Phaser, Vitest, Playwright screenshot verification.

---

## File Structure

- Create `package.json`: npm scripts and dependencies.
- Create `index.html`: app mount points for canvas, HUD, and debug log.
- Create `tsconfig.json`: TypeScript app configuration.
- Create `vite.config.ts`: Vite and Vitest configuration.
- Create `src/main.ts`: app bootstrap.
- Create `src/style.css`: full-screen game layout, HUD, and debug log styling.
- Create `src/game/config/combatConfig.ts`: all movement, attack, KO, camera, and box tuning values.
- Create `src/game/simulation/types.ts`: shared combat types.
- Create `src/game/simulation/geometry.ts`: rectangle and facing helpers.
- Create `src/game/simulation/fighters.ts`: fighter creation and derived box helpers.
- Create `src/game/simulation/round.ts`: deterministic round update, state transitions, hit detection, blocking, input buffer, hit pause, KO freeze, proof logs.
- Create `src/game/input/inputMapper.ts`: keyboard-to-action mapping.
- Create `src/game/render/FightScene.ts`: thin Phaser scene that renders state, forwards input, and draws debug boxes.
- Create `src/ui/hud.ts`: DOM HUD update helper.
- Create `src/ui/debugLog.ts`: proof log rendering helper.
- Create `src/test/round.test.ts`: simulation unit tests for combat behavior.
- Create `src/test/setup.ts`: test setup placeholder for Vitest.
- Create `tests/phase1.spec.ts`: Playwright browser smoke test and screenshot capture.
- Create `.gitignore`: ignore dependencies, build output, browser reports, and local brainstorming artifacts.

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `.gitignore`

- [ ] **Step 1: Create npm package metadata**

Create `package.json`:

```json
{
  "name": "vix-carter-fighting-game",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "verify:browser": "playwright test"
  },
  "dependencies": {
    "phaser": "^3.90.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.54.0",
    "typescript": "^5.8.3",
    "vite": "^6.3.5",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 2: Create HTML shell**

Create `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vix x Carter: Phase 1</title>
  </head>
  <body>
    <div id="app">
      <div id="game-root"></div>
      <div id="hud-root"></div>
      <div id="debug-log" aria-live="polite"></div>
    </div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 3: Create TypeScript config**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vitest/globals"],
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["src", "tests", "vite.config.ts"]
}
```

- [ ] **Step 4: Create Vite config**

Create `vite.config.ts`:

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  test: {
    environment: 'node',
    include: ['src/test/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
  },
});
```

- [ ] **Step 5: Create gitignore**

Create `.gitignore`:

```gitignore
node_modules/
dist/
coverage/
playwright-report/
test-results/
.superpowers/
*.log
```

- [ ] **Step 6: Install dependencies**

Run: `npm.cmd install`

Expected: dependencies install and `package-lock.json` is created.

- [ ] **Step 7: Run initial build command**

Run: `npm.cmd run build`

Expected: build fails because `src/main.ts` does not exist yet. This confirms the toolchain runs.

- [ ] **Step 8: Commit scaffold**

```bash
git add .gitignore index.html package.json package-lock.json tsconfig.json vite.config.ts
git commit -m "Scaffold Phaser TypeScript app"
```

---

### Task 2: Combat Config And Types

**Files:**
- Create: `src/game/config/combatConfig.ts`
- Create: `src/game/simulation/types.ts`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Create test setup**

Create `src/test/setup.ts`:

```ts
export {};
```

- [ ] **Step 2: Create simulation types**

Create `src/game/simulation/types.ts`:

```ts
export type FighterId = 'vix' | 'carter';

export type FighterState =
  | 'idle'
  | 'walk'
  | 'jump'
  | 'fall'
  | 'block'
  | 'lightStartup'
  | 'lightActive'
  | 'lightRecovery'
  | 'heavyStartup'
  | 'heavyActive'
  | 'heavyRecovery'
  | 'hitstun'
  | 'ko';

export type Facing = -1 | 1;
export type AttackKind = 'light' | 'heavy';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FighterActions {
  left: boolean;
  right: boolean;
  jump: boolean;
  block: boolean;
  light: boolean;
  heavy: boolean;
}

export interface AttackConfig {
  startupMs: number;
  activeMs: number;
  recoveryMs: number;
  damage: number;
  blockDamage: number;
  range: number;
  knockback: number;
  hitstunMs: number;
}

export interface Fighter {
  id: FighterId;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: Facing;
  health: number;
  grounded: boolean;
  state: FighterState;
  stateTimerMs: number;
  activeAttack: AttackKind | null;
  hasHitThisAttack: boolean;
  bufferedAttack: AttackKind | null;
  bufferedAttackMs: number;
  tint: number;
}

export interface CombatLogEntry {
  kind: 'HIT' | 'BLOCK' | 'KO';
  message: string;
}

export interface RoundState {
  fighters: Record<FighterId, Fighter>;
  winner: FighterId | null;
  hitPauseMs: number;
  koFreezeMs: number;
  elapsedMs: number;
  logs: CombatLogEntry[];
}
```

- [ ] **Step 3: Create combat config**

Create `src/game/config/combatConfig.ts`:

```ts
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
```

- [ ] **Step 4: Type-check config and types**

Run: `npm.cmd run build`

Expected: build still fails because `src/main.ts` does not exist, but TypeScript reports no errors from the new config/type files.

- [ ] **Step 5: Commit config and types**

```bash
git add src/game/config/combatConfig.ts src/game/simulation/types.ts src/test/setup.ts
git commit -m "Add combat config and state types"
```

---

### Task 3: Pure Simulation Engine

**Files:**
- Create: `src/game/simulation/geometry.ts`
- Create: `src/game/simulation/fighters.ts`
- Create: `src/game/simulation/round.ts`
- Create: `src/test/round.test.ts`

- [ ] **Step 1: Write simulation tests**

Create `src/test/round.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createRoundState, updateRound } from '../game/simulation/round';

const none = { left: false, right: false, jump: false, block: false, light: false, heavy: false };

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
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm.cmd test`

Expected: FAIL because `src/game/simulation/round.ts` does not exist.

- [ ] **Step 3: Create geometry helpers**

Create `src/game/simulation/geometry.ts`:

```ts
import type { Facing, Rect } from './types';

export function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function isFacingAttacker(defenderFacing: Facing, defenderX: number, attackerX: number): boolean {
  return attackerX < defenderX ? defenderFacing === -1 : defenderFacing === 1;
}

export function centeredRect(x: number, bottomY: number, width: number, height: number): Rect {
  return {
    x: x - width / 2,
    y: bottomY - height,
    width,
    height,
  };
}
```

- [ ] **Step 4: Create fighter helpers**

Create `src/game/simulation/fighters.ts`:

```ts
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
  const x = fighter.facing === 1 ? fighter.x + combatConfig.boxes.collision.width / 2 : fighter.x - combatConfig.boxes.collision.width / 2 - width;

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

export function isAttacking(fighter: Fighter): boolean {
  return fighter.state.startsWith('light') || fighter.state.startsWith('heavy');
}

export function isActionLocked(fighter: Fighter): boolean {
  return isAttacking(fighter) || fighter.state === 'hitstun' || fighter.state === 'ko';
}
```

- [ ] **Step 5: Create round simulation**

Create `src/game/simulation/round.ts`:

```ts
import { combatConfig } from '../config/combatConfig';
import { intersects, isFacingAttacker } from './geometry';
import { createFighter, getAttackHitbox, getCurrentAttackKind, getHurtbox, isActionLocked, isAttacking } from './fighters';
import type { AttackKind, Fighter, FighterActions, FighterId, FighterState, RoundState } from './types';

const ids: FighterId[] = ['vix', 'carter'];

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

  for (const id of ids) {
    updateInputBuffer(round.fighters[id], input[id], deltaMs);
  }

  for (const id of ids) {
    updateFighter(round.fighters[id], input[id], deltaMs);
  }

  resolveBodyPush(round.fighters.vix, round.fighters.carter);
  resolveHits(round);
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
  } else if (actions.heavy) {
    fighter.bufferedAttack = 'heavy';
    fighter.bufferedAttackMs = combatConfig.inputBufferMs;
  } else if (fighter.bufferedAttackMs > 0) {
    fighter.bufferedAttackMs = Math.max(0, fighter.bufferedAttackMs - deltaMs);
    if (fighter.bufferedAttackMs === 0) {
      fighter.bufferedAttack = null;
    }
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

  if (!fighter.grounded) {
    fighter.vy = Math.min(combatConfig.movement.maxFallSpeed, fighter.vy + combatConfig.movement.gravity * (deltaMs / 1000));
    fighter.y += fighter.vy * (deltaMs / 1000);
    if (fighter.y >= combatConfig.movement.groundY) {
      fighter.y = combatConfig.movement.groundY;
      fighter.vy = 0;
      fighter.grounded = true;
    }
  }

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
  for (const attackerId of ids) {
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
  defender.vx = attacker.facing * config.knockback * (blocked ? 0.35 : 1);
  defender.vy = blocked ? 0 : -80;
  attacker.hasHitThisAttack = true;
  round.hitPauseMs = combatConfig.hitPauseMs;

  if (blocked) {
    round.logs.push({
      kind: 'BLOCK',
      message: `BLOCK: ${defender.label} blocked ${attacker.label} ${attack} | damage=${damage} | ${defender.id}Health=${defender.health}`,
    });
  } else {
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
    defender.state !== 'hitstun' &&
    defender.state !== 'ko' &&
    isFacingAttacker(defender.facing, defender.x, attacker.x)
  );
}

function clampStage(x: number): number {
  return Math.max(combatConfig.movement.stageLeft, Math.min(combatConfig.movement.stageRight, x));
}
```

- [ ] **Step 6: Run tests**

Run: `npm.cmd test`

Expected: PASS for `src/test/round.test.ts`.

- [ ] **Step 7: Commit simulation**

```bash
git add src/game/simulation src/test/round.test.ts
git commit -m "Add deterministic fighting round simulation"
```

---

### Task 4: Input, HUD, And App Bootstrap

**Files:**
- Create: `src/game/input/inputMapper.ts`
- Create: `src/ui/hud.ts`
- Create: `src/ui/debugLog.ts`
- Create: `src/style.css`
- Create: `src/main.ts`

- [ ] **Step 1: Create input mapper**

Create `src/game/input/inputMapper.ts`:

```ts
import type { FighterActions, FighterId } from '../simulation/types';

const emptyActions = (): FighterActions => ({
  left: false,
  right: false,
  jump: false,
  block: false,
  light: false,
  heavy: false,
});

export class InputMapper {
  private readonly pressed = new Set<string>();

  bind(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  getActions(): Record<FighterId, FighterActions> {
    return {
      vix: {
        left: this.pressed.has('KeyA'),
        right: this.pressed.has('KeyD'),
        jump: this.pressed.has('KeyW'),
        block: this.pressed.has('KeyS'),
        light: this.pressed.has('KeyF'),
        heavy: this.pressed.has('KeyG'),
      },
      carter: {
        left: this.pressed.has('ArrowLeft'),
        right: this.pressed.has('ArrowRight'),
        jump: this.pressed.has('ArrowUp'),
        block: this.pressed.has('ArrowDown'),
        light: this.pressed.has('KeyK'),
        heavy: this.pressed.has('KeyL'),
      },
    };
  }

  wantsRestart(): boolean {
    return this.pressed.has('KeyR');
  }

  wantsDebugToggle(): boolean {
    return this.pressed.has('KeyH') || this.pressed.has('F1');
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'F1'].includes(event.code)) {
      event.preventDefault();
    }
    this.pressed.add(event.code);
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.pressed.delete(event.code);
  };
}

export function createEmptyActionRecord(): Record<FighterId, FighterActions> {
  return {
    vix: emptyActions(),
    carter: emptyActions(),
  };
}
```

- [ ] **Step 2: Create HUD helper**

Create `src/ui/hud.ts`:

```ts
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
```

- [ ] **Step 3: Create debug log helper**

Create `src/ui/debugLog.ts`:

```ts
import type { RoundState } from '../game/simulation/types';

export function renderDebugLog(root: HTMLElement, round: RoundState, visible: boolean): void {
  root.classList.toggle('visible', visible);
  const recent = round.logs.slice(-8).map((entry) => `<div>${entry.message}</div>`).join('');
  root.innerHTML = visible ? `<strong>Proof Log</strong>${recent || '<div>No combat events yet</div>'}` : '';
}
```

- [ ] **Step 4: Create CSS**

Create `src/style.css`:

```css
* {
  box-sizing: border-box;
}

html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
  background: #111318;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #f7efe3;
}

#game-root {
  position: fixed;
  inset: 0;
}

#hud-root {
  position: fixed;
  top: 18px;
  left: 24px;
  right: 24px;
  pointer-events: none;
  z-index: 3;
}

.hud {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) auto minmax(180px, 1fr);
  gap: 18px;
  align-items: start;
}

.fighter-panel,
.round-status {
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(12, 14, 20, 0.74);
  padding: 10px 12px;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.24);
}

.fighter-panel {
  border-radius: 8px;
}

.fighter-panel.carter {
  text-align: right;
}

.fighter-name {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0;
}

.health-shell {
  height: 14px;
  margin-top: 8px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: rgba(0, 0, 0, 0.4);
}

.health-fill {
  height: 100%;
  background: linear-gradient(90deg, #38d47a, #f4ca4f);
}

.state-label,
.round-status span {
  display: block;
  margin-top: 6px;
  color: rgba(247, 239, 227, 0.78);
  font-size: 12px;
}

.round-status {
  min-width: 190px;
  text-align: center;
  border-radius: 8px;
}

#debug-log {
  position: fixed;
  right: 18px;
  bottom: 18px;
  display: none;
  width: min(520px, calc(100vw - 36px));
  max-height: 220px;
  overflow: hidden;
  z-index: 4;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 8px;
  background: rgba(5, 8, 12, 0.82);
  padding: 12px;
  color: #d8f7ff;
  font-family: "Cascadia Code", Consolas, monospace;
  font-size: 12px;
  line-height: 1.5;
}

#debug-log.visible {
  display: block;
}
```

- [ ] **Step 5: Create temporary app bootstrap**

Create `src/main.ts`:

```ts
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
```

- [ ] **Step 6: Run tests and build**

Run: `npm.cmd test`

Expected: PASS.

Run: `npm.cmd run build`

Expected: PASS.

- [ ] **Step 7: Commit app shell**

```bash
git add src/game/input/inputMapper.ts src/ui src/style.css src/main.ts
git commit -m "Add input and HUD shell"
```

---

### Task 5: Phaser Fight Scene

**Files:**
- Create: `src/game/render/FightScene.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Create Phaser scene**

Create `src/game/render/FightScene.ts`:

```ts
import Phaser from 'phaser';
import { combatConfig } from '../config/combatConfig';
import { InputMapper } from '../input/inputMapper';
import { getAttackHitbox, getCollisionBox, getHurtbox } from '../simulation/fighters';
import { createRoundState, updateRound } from '../simulation/round';
import type { Fighter, RoundState } from '../simulation/types';
import { renderDebugLog } from '../../ui/debugLog';
import { renderHud } from '../../ui/hud';

export class FightScene extends Phaser.Scene {
  private round: RoundState = createRoundState();
  private inputMapper = new InputMapper();
  private sprites = new Map<string, Phaser.GameObjects.Rectangle>();
  private debugGraphics?: Phaser.GameObjects.Graphics;
  private debugVisible = false;
  private debugWasPressed = false;
  private hudRoot!: HTMLElement;
  private debugRoot!: HTMLElement;

  constructor() {
    super('fight');
  }

  create(): void {
    this.hudRoot = document.querySelector<HTMLElement>('#hud-root')!;
    this.debugRoot = document.querySelector<HTMLElement>('#debug-log')!;
    this.inputMapper.bind();
    this.createArena();
    this.createFighterSprite(this.round.fighters.vix);
    this.createFighterSprite(this.round.fighters.carter);
    this.debugGraphics = this.add.graphics().setDepth(20);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.inputMapper.destroy());
  }

  update(_time: number, delta: number): void {
    if (this.inputMapper.wantsDebugToggle() && !this.debugWasPressed) {
      this.debugVisible = !this.debugVisible;
    }
    this.debugWasPressed = this.inputMapper.wantsDebugToggle();

    if (this.round.winner && this.round.koFreezeMs <= 0 && this.inputMapper.wantsRestart()) {
      this.round = createRoundState();
    }

    updateRound(this.round, Math.min(delta, 33), this.inputMapper.getActions());
    this.syncSprites();
    this.drawDebug();
    renderHud(this.hudRoot, this.round);
    renderDebugLog(this.debugRoot, this.round, this.debugVisible);
  }

  private createArena(): void {
    this.cameras.main.setBackgroundColor('#18202b');
    this.add.rectangle(480, 548, 960, 96, 0x222832).setDepth(0);
    this.add.rectangle(480, 518, 960, 6, 0xf0c052).setDepth(1);
    this.add.text(480, 120, 'Vix x Carter', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '42px',
      color: '#f7efe3',
    }).setOrigin(0.5).setAlpha(0.2);
    this.add.text(480, 590, 'Phase 1 Combat Lab', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#f7efe3',
    }).setOrigin(0.5).setAlpha(0.62);
  }

  private createFighterSprite(fighter: Fighter): void {
    const sprite = this.add.rectangle(fighter.x, fighter.y - 54, 42, 108, fighter.tint).setDepth(10);
    this.sprites.set(fighter.id, sprite);
    this.add.text(fighter.x, fighter.y - 136, fighter.label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
    }).setName(`${fighter.id}-name`).setOrigin(0.5).setDepth(11);
  }

  private syncSprites(): void {
    for (const fighter of Object.values(this.round.fighters)) {
      const sprite = this.sprites.get(fighter.id);
      if (!sprite) {
        continue;
      }
      sprite.setPosition(fighter.x, fighter.y - 54);
      sprite.setFillStyle(fighter.state === 'block' ? 0x7fd3ff : fighter.tint);
      sprite.setScale(fighter.facing, 1);

      const label = this.children.getByName(`${fighter.id}-name`) as Phaser.GameObjects.Text | null;
      label?.setPosition(fighter.x, fighter.y - 136);
    }
  }

  private drawDebug(): void {
    if (!this.debugGraphics) {
      return;
    }
    this.debugGraphics.clear();
    if (!this.debugVisible) {
      return;
    }

    for (const fighter of Object.values(this.round.fighters)) {
      this.strokeBox(getCollisionBox(fighter), 0xffffff);
      this.strokeBox(getHurtbox(fighter), 0x38d47a);
      const hitbox = getAttackHitbox(fighter);
      if (hitbox) {
        this.strokeBox(hitbox, 0xff3d57);
      }
      this.debugGraphics.lineStyle(3, 0xf4ca4f, 1);
      this.debugGraphics.lineBetween(fighter.x, fighter.y - 132, fighter.x + fighter.facing * 28, fighter.y - 132);
      this.addStateText(fighter);
    }
  }

  private strokeBox(box: { x: number; y: number; width: number; height: number }, color: number): void {
    this.debugGraphics?.lineStyle(2, color, 0.9);
    this.debugGraphics?.strokeRect(box.x, box.y, box.width, box.height);
  }

  private addStateText(fighter: Fighter): void {
    const key = `${fighter.id}-debug-state`;
    let text = this.children.getByName(key) as Phaser.GameObjects.Text | null;
    if (!text) {
      text = this.add.text(0, 0, '', {
        fontFamily: 'Consolas, monospace',
        fontSize: '12px',
        color: '#d8f7ff',
      }).setName(key).setDepth(25);
    }
    text.setVisible(this.debugVisible);
    text.setText(`${fighter.state} HP:${fighter.health}`);
    text.setPosition(fighter.x - 34, fighter.y - combatConfig.boxes.hurt.height - 26);
  }
}
```

- [ ] **Step 2: Wire Phaser bootstrap**

Replace `src/main.ts` with:

```ts
import Phaser from 'phaser';
import './style.css';
import { FightScene } from './game/render/FightScene';

const gameRoot = document.querySelector<HTMLElement>('#game-root');

if (!gameRoot) {
  throw new Error('Missing game root');
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: gameRoot,
  width: 960,
  height: 640,
  backgroundColor: '#18202b',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [FightScene],
});
```

- [ ] **Step 3: Run tests and build**

Run: `npm.cmd test`

Expected: PASS.

Run: `npm.cmd run build`

Expected: PASS.

- [ ] **Step 4: Commit scene**

```bash
git add src/main.ts src/game/render/FightScene.ts
git commit -m "Render playable Phase 1 fight scene"
```

---

### Task 6: Browser Verification

**Files:**
- Create: `tests/phase1.spec.ts`

- [ ] **Step 1: Create Playwright smoke test**

Create `tests/phase1.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('phase 1 arena renders with HUD and debug toggle', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#hud-root')).toContainText('Vix');
  await expect(page.locator('#hud-root')).toContainText('Carter');
  await page.keyboard.press('KeyH');
  await expect(page.locator('#debug-log')).toBeVisible();
  await page.screenshot({ path: 'test-results/phase1-arena.png', fullPage: true });
});
```

- [ ] **Step 2: Add Playwright web server config**

Modify `vite.config.ts` only if needed by Playwright through command flags instead of config. Use this command for verification:

Run: `npx.cmd playwright test --web-server "npm.cmd run dev" --web-server-timeout 120000`

Expected: PASS and `test-results/phase1-arena.png` exists.

- [ ] **Step 3: Manual combat proof**

Run: `npm.cmd run dev`

Open: `http://127.0.0.1:5173`

Manual checks:

- Press `D` to move Vix right.
- Press `W` to jump.
- Press `F` near Carter to land a light hit.
- Press `H` to show debug boxes and proof log.
- Hold Carter down arrow while Vix attacks to confirm `BLOCK` log.
- Reduce Carter to zero health and confirm `KO` log and delayed restart.

- [ ] **Step 4: Commit verification**

```bash
git add tests/phase1.spec.ts test-results/phase1-arena.png
git commit -m "Verify Phase 1 browser prototype"
```

---

## Self-Review Checklist

- Spec coverage: This plan covers Phaser/Vite setup, deterministic simulation, state machine, config values, movement, input buffer, KO freeze, static camera, boxes, blocking, debug overlay, proof logs, HUD, tests, and browser screenshot verification.
- Placeholder scan: Clean; each task names concrete files, commands, and expected outcomes.
- Type consistency: `Fighter`, `RoundState`, `FighterActions`, `AttackKind`, and config property names are introduced before use and stay consistent across tasks.
