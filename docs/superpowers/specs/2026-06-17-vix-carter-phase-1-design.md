# Vix and Carter Fighting Game - Phase 1 Design

## Goal

Build the first playable slice of a 2D browser fighting game starring Vix and Carter. Phase 1 prioritizes feel and structure over final art: two placeholder fighters, one arena, basic attacks, blocking, health, round reset, and a clean foundation for character-specific moves later.

## Recommended Approach

Use Phaser, TypeScript, and Vite. Phaser is the right fit because this is a sprite-based side-view action game with collision, animation timing, camera control, and fast iteration needs. The game should run locally in the browser first, then later can be packaged or deployed.

Phase 1 will use simple readable placeholder fighters instead of trying to crop production-ready sprites from the reference art immediately. The reference folder at `D:\Projects\Vix x Carter` will guide names, colors, portraits, stage mood, and future character identity, but the first milestone is a playable combat loop.

## Phase 1 Player Experience

The player opens the game and lands directly in a Vix vs Carter fight. Vix starts on the left, Carter starts on the right. Each fighter can move left and right, jump, block, use a light attack, and use a heavy attack. Health bars show damage. When one fighter reaches zero health, the round pauses with a win state and can be restarted.

The first version will support local keyboard controls for both fighters:

- Vix: `A` / `D` to move, `W` to jump, `S` to block, `F` light attack, `G` heavy attack.
- Carter: arrow keys to move and jump, down arrow to block, `K` light attack, `L` heavy attack.
- Shared: `R` restarts the round.

## Combat Rules

Each fighter has position, velocity, facing direction, health, grounded state, current state, state timer, collision box, hurtbox, and optional active attack hitbox. Attacks create temporary hitboxes in front of the fighter. A hitbox can damage the opponent once per attack activation. Blocking reduces damage and knockback only when the block rules below pass.

Fighter states will be explicit from day one:

- `idle`
- `walk`
- `jump`
- `fall`
- `block`
- `lightStartup`
- `lightActive`
- `lightRecovery`
- `heavyStartup`
- `heavyActive`
- `heavyRecovery`
- `hitstun`
- `ko`

The state machine controls what a fighter can and cannot do during each timing window. A fighter cannot start a new attack during startup, active, recovery, hitstun, or KO. A fighter cannot block while attacking, in hitstun, or KO.

Initial values will live in one tunable combat config file:

- Health: 100 each.
- Light attack: 90ms startup, 90ms active, 180ms recovery, 8 damage, 2 block damage, 42px range, 120px knockback.
- Heavy attack: 180ms startup, 120ms active, 320ms recovery, 16 damage, 5 block damage, 62px range, 220px knockback.
- Hitstun: 220ms for light hits, 320ms for heavy hits.
- Hit pause: 70ms on successful hits.
- Jump: single jump only.
- Round ends when health reaches 0.

Use separate boxes even while the characters are placeholders:

- Collision box: prevents fighters from occupying the same space.
- Hurtbox: area where a fighter can be hit.
- Attack hitbox: temporary active strike area.

A block is valid only when all of these are true:

- Defender is holding block.
- Defender is not attacking.
- Defender is facing the attacker.
- Defender is not in hitstun.
- Defender is not KO.

## Architecture

Gameplay state should live outside Phaser scenes. Phaser should render sprites, read input, show effects, and display the arena. This keeps combat rules testable and easier to evolve.

Core modules:

- `game/simulation`: fighter state, round state, combat update loop, hit detection, damage rules.
- `game/input`: maps keyboard keys to fighter actions.
- `game/render`: Phaser scenes and visual adapters.
- `game/assets`: stable asset manifest keys for placeholders now and real art later.
- `game/config`: tunable movement, attack, damage, hitstun, and box values.
- `ui`: DOM overlay for health bars, round status, and restart prompt.
- `debug`: toggleable overlay for combat proof and tuning.

## Visual Direction

Phase 1 should feel like a rough arcade prototype, not a final cartoon episode. Use strong silhouettes and distinct colors:

- Vix: quick, sharp, warm accent color.
- Carter: sturdy, heavier, cool or earth accent color.
- Stage: simple city/street/comic-panel inspired arena, using the existing Vix and Carter universe as reference later.

No final character sprite extraction is required in Phase 1. That belongs in Phase 3 after the combat loop is proven.

## Testing And Verification

Phase 1 is complete when:

- The app installs and runs locally.
- Both fighters can move, jump, attack, block, take damage, and restart.
- Health bars update accurately.
- Light and heavy attacks have separate startup, active, and recovery timing.
- Attacks use temporary hitboxes, not permanent collision overlap.
- Each attack can only hit once per activation.
- Blocking only works when the defender is facing the attacker and is not attacking, in hitstun, or KO.
- A successful hit applies damage, knockback, hitstun, and light hit pause.
- The round ends reliably at zero health.
- Combat tuning values live in one config file.
- A debug overlay can be toggled with `H` or `F1`.
- The debug overlay shows collision boxes, hurtboxes, active attack hitboxes, facing direction, current state text, and health values.
- A browser screenshot confirms the arena, fighters, and HUD are visible.

## Out Of Scope For Phase 1

- Online multiplayer.
- AI opponent.
- Final character animation sheets.
- Story mode.
- Controller support.
- Mobile packaging.
- Extra characters such as Al Sharkton or Slum.
- Advanced fighting mechanics like grabs, cancels, combos, super meter, or parries.
- Screen shake and large visual effects.

## Later Phases

Phase 2 will make Vix and Carter mechanically distinct. Vix becomes faster and combo-oriented. Carter becomes heavier, harder-hitting, and more defensive.

Phase 3 will bring in visual polish from `D:\Projects\Vix x Carter`: portraits, colors, cropped references if useful, stage inspiration, menus, and title treatment.

Phase 4 will add fighting-game feel: hit-stop, screen shake, better knockback, sound effects, special moves, win poses, and round transitions.

Phase 5 can expand into more characters, story mode, deployment, and packaging.
