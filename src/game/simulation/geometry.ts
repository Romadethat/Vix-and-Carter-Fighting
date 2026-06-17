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
