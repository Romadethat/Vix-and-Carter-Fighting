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
