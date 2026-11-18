// Screenshot staging: ?shot=start|play|end (with &seed=N) paints one fixed
// scene instead of running the loop, twice, then sets window.__shotReady.
// The scenes are the real game state, rendered by the real renderer.
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function fakeInput() {
  return {
    direction: () => null,
    pointerTarget: () => null,
    mouseDown: () => false,
  };
}

export function stageShot(name, world) {
  const s = world.state;
  if (name === 'play') {
    world.reset();
    s.score = 340;
    s.wave = 3;
    s.seedsCaught = 12;
    s.needed = 25;
    s.combo = 4;
    s.mult = 4;
    s.comboTimer = 2.0;
    s.player.x = s.w * 0.5;
    s.player.y = s.h * 0.62;
    s.player.shield = true;
    s.banner = null;
    // Let the world run a little so seeds, shards and a power-up are mid-fall.
    const input = fakeInput();
    for (let i = 0; i < 60 * 3; i++) world.step(1 / 60, input, false);
    s.player.x = s.w * 0.5;
    s.player.y = s.h * 0.62;
    s.popups.push({ x: s.w * 0.5, y: s.h * 0.4, text: '+40', color: '#ffe9a8', size: 22, life: 1.0, maxLife: 1.1 });
    return { screen: SCREEN_PLAY, best: 1250 };
  }
  if (name === 'end') {
    world.reset();
    s.score = 860;
    s.wave = 5;
    s.seedsCaught = 9;
    s.lives = 0;
    s.over = true;
    s.player.x = s.w * 0.5;
    s.player.y = s.h * 0.6;
    s.particles.push(
      { x: s.w * 0.5, y: s.h * 0.6, vx: 0, vy: 0, life: 0.8, maxLife: 0.8, size: 20, color: '#ff5d7a', grav: 0 },
    );
    return { screen: SCREEN_OVER, best: 1250 };
  }
  world.reset();
  return { screen: SCREEN_TITLE, best: 1250 };
}
