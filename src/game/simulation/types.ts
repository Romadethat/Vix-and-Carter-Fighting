export type FighterId = 'vix' | 'carter';

export type FighterState =
  | 'idle'
  | 'walk'
  | 'crouch'
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
export type AttackHeight = 'high' | 'mid' | 'low' | 'overhead';
export type BlockMode = 'none' | 'standing' | 'crouching';
export type FlashKind = 'none' | 'hit' | 'block';

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
  crouch: boolean;
  block: boolean;
  light: boolean;
  heavy: boolean;
}

export interface AttackConfig {
  height: AttackHeight;
  startupMs: number;
  activeMs: number;
  recoveryMs: number;
  damage: number;
  blockDamage: number;
  range: number;
  knockback: number;
  hitstunMs: number;
}

export interface FighterFlash {
  kind: FlashKind;
  remainingMs: number;
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
  flash: FighterFlash;
  lastHitBy: AttackKind | null;
  blockMode: BlockMode;
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
