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
  private nameLabels = new Map<string, Phaser.GameObjects.Text>();
  private stateLabels = new Map<string, Phaser.GameObjects.Text>();
  private debugGraphics?: Phaser.GameObjects.Graphics;
  private debugVisible = false;
  private hudRoot!: HTMLElement;
  private debugRoot!: HTMLElement;

  constructor() {
    super('fight');
  }

  create(): void {
    const hudRoot = document.querySelector<HTMLElement>('#hud-root');
    const debugRoot = document.querySelector<HTMLElement>('#debug-log');

    if (!hudRoot || !debugRoot) {
      throw new Error('Missing HUD or debug root');
    }

    this.hudRoot = hudRoot;
    this.debugRoot = debugRoot;
    this.inputMapper.bind();
    this.createArena();
    this.createFighterSprite(this.round.fighters.vix);
    this.createFighterSprite(this.round.fighters.carter);
    this.debugGraphics = this.add.graphics().setDepth(20);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.inputMapper.destroy());
  }

  update(_time: number, delta: number): void {
    if (this.inputMapper.consumeDebugToggle()) {
      this.debugVisible = !this.debugVisible;
    }

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
    this.add
      .text(480, 120, 'Vix x Carter', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '42px',
        color: '#f7efe3',
      })
      .setOrigin(0.5)
      .setAlpha(0.2);
    this.add
      .text(480, 590, 'Phase 1 Combat Lab', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#f7efe3',
      })
      .setOrigin(0.5)
      .setAlpha(0.62);
  }

  private createFighterSprite(fighter: Fighter): void {
    const sprite = this.add.rectangle(fighter.x, fighter.y - 54, 42, 108, fighter.tint).setDepth(10);
    const nameLabel = this.add
      .text(fighter.x, fighter.y - 136, fighter.label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(11);
    const stateLabel = this.add
      .text(0, 0, '', {
        fontFamily: 'Consolas, monospace',
        fontSize: '12px',
        color: '#d8f7ff',
      })
      .setDepth(25)
      .setVisible(false);

    this.sprites.set(fighter.id, sprite);
    this.nameLabels.set(fighter.id, nameLabel);
    this.stateLabels.set(fighter.id, stateLabel);
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
      this.nameLabels.get(fighter.id)?.setPosition(fighter.x, fighter.y - 136);
    }
  }

  private drawDebug(): void {
    if (!this.debugGraphics) {
      return;
    }

    this.debugGraphics.clear();

    for (const label of this.stateLabels.values()) {
      label.setVisible(this.debugVisible);
    }

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

      const arrowY = fighter.y - combatConfig.boxes.collision.height - 8;
      this.debugGraphics.lineStyle(3, 0xf4ca4f, 1);
      this.debugGraphics.lineBetween(fighter.x, arrowY, fighter.x + fighter.facing * 28, arrowY);
      this.updateStateText(fighter);
    }
  }

  private strokeBox(box: { x: number; y: number; width: number; height: number }, color: number): void {
    this.debugGraphics?.lineStyle(2, color, 0.9);
    this.debugGraphics?.strokeRect(box.x, box.y, box.width, box.height);
  }

  private updateStateText(fighter: Fighter): void {
    const text = this.stateLabels.get(fighter.id);

    if (!text) {
      return;
    }

    text.setText(`${fighter.state} HP:${fighter.health}`);
    text.setPosition(fighter.x - 40, fighter.y - combatConfig.boxes.hurt.height - 52);
  }
}
