// Starfall Shepherd — the simulation. A lantern-spirit gathers falling
// star-seeds, dodges void shards, and clears 8 waves to bring back the dawn.
// Pure state in, events out; the renderer only reads, never writes.
import { COMBO_MAX, COMBO_WINDOW, INVULN_TIME, LIVES, PULSE_COOLDOWN, PULSE_RADIUS, WAVES, seedsNeeded, waveClearBonus } from './config.js';

export const EVENT_CATCH = 1;
export const EVENT_HIT = 2;
export const EVENT_OVER = 4;
export const EVENT_WIN = 8;
export const EVENT_WAVE = 16;
export const EVENT_POWER = 32;
export const EVENT_PULSE = 64;

const POWER_KINDS = ['shield', 'magnet', 'slow', 'heart'];

export function createWorld(random) {
  const state = {
    w: 960,
    h: 600,
    time: 0,
    score: 0,
    lives: LIVES,
    combo: 0,
    mult: 1,
    comboTimer: 0,
    wave: 1,
    seedsCaught: 0,
    needed: seedsNeeded(1),
    player: { x: 480, y: 480, vx: 0, vy: 0, r: 20, invuln: 0, shield: false, magnet: 0, slow: 0 },
    pulseCooldown: 0,
    entities: [],
    particles: [],
    popups: [],
    stars: [],
    shake: 0,
    flash: 0,
    banner: null,
    over: false,
    won: false,
    lastCatchCombo: 0,
    lastPower: null,
  };
  let spawnTimer = 0.6;
  let powerTimer = 12;

  function groundY() {
    return state.h - 46;
  }

  function makeStars() {
    state.stars = [];
    for (let i = 0; i < 110; i++) {
      state.stars.push({
        x: random.range(0, state.w),
        y: random.range(0, state.h * 0.75),
        r: random.range(0.6, 2.2),
        phase: random.range(0, Math.PI * 2),
        speed: random.range(0.5, 2),
      });
    }
  }

  function burst(x, y, color, n, speed = 160) {
    for (let i = 0; i < n; i++) {
      const a = random.range(0, Math.PI * 2);
      const v = random.range(speed * 0.3, speed);
      state.particles.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 40,
        life: random.range(0.4, 0.9),
        maxLife: 0.9,
        size: random.range(1.5, 4),
        color,
        grav: 220,
      });
    }
  }

  function popup(x, y, text, color, size = 18) {
    state.popups.push({ x, y, text, color, size, life: 1.1, maxLife: 1.1 });
  }

  function spawn(kind, x = null) {
    const px = x ?? random.range(30, state.w - 30);
    const wave = state.wave;
    if (kind === 'seed') {
      state.entities.push({
        kind, x: px, y: -16, r: 11,
        vy: random.range(75, 130) + wave * 9,
        vx: 0, sway: random.range(0, Math.PI * 2), swayAmp: random.range(12, 42),
        rot: random.range(0, Math.PI * 2), spin: random.range(-1.5, 1.5),
      });
    } else if (kind === 'shard') {
      state.entities.push({
        kind, x: px, y: -18, r: 14,
        vy: random.range(120, 185) + wave * 13,
        vx: 0, sway: random.range(0, Math.PI * 2), swayAmp: random.range(8, 26),
        rot: random.range(0, Math.PI * 2), spin: random.range(-2.5, 2.5),
      });
    } else {
      state.entities.push({
        kind: 'power', power: kind, x: px, y: -16, r: 13,
        vy: 62, vx: 0, sway: random.range(0, Math.PI * 2), swayAmp: 24,
        rot: 0, spin: 1.2,
      });
    }
  }

  function catchSeed(e, silent = false) {
    state.combo = Math.min(state.combo + 1, COMBO_MAX);
    state.mult = state.combo;
    state.comboTimer = COMBO_WINDOW;
    const gained = 10 * state.mult;
    state.score += gained;
    state.seedsCaught += 1;
    state.lastCatchCombo = state.combo;
    burst(e.x, e.y, '#ffd76a', 12);
    popup(e.x, e.y - 14, `+${gained}`, '#ffe9a8', 16 + Math.min(state.combo, 8));
    return EVENT_CATCH;
  }

  function applyPower(kind) {
    const p = state.player;
    state.lastPower = kind;
    if (kind === 'shield') p.shield = true;
    else if (kind === 'magnet') p.magnet = 6;
    else if (kind === 'slow') p.slow = 5;
    else if (kind === 'heart') state.lives = Math.min(state.lives + 1, 5);
    const label = { shield: 'SHIELD!', magnet: 'MAGNET!', slow: 'SLOW TIME!', heart: '+1 LIFE!' }[kind];
    popup(p.x, p.y - 34, label, '#9fe8ff', 20);
    burst(p.x, p.y, '#9fe8ff', 16, 200);
    return EVENT_POWER;
  }

  function hitByShard(e) {
    const p = state.player;
    if (p.invuln > 0) return 0;
    burst(e.x, e.y, '#b06bff', 18, 220);
    if (p.shield) {
      p.shield = false;
      p.invuln = 1.0;
      popup(p.x, p.y - 34, 'SHIELD HELD!', '#9fe8ff', 20);
      return EVENT_HIT;
    }
    state.lives -= 1;
    state.combo = 0;
    state.mult = 1;
    p.invuln = INVULN_TIME;
    state.shake = 14;
    state.flash = 0.55;
    burst(p.x, p.y, '#ff5d7a', 22, 260);
    if (state.lives <= 0) {
      state.over = true;
      return EVENT_HIT | EVENT_OVER;
    }
    return EVENT_HIT;
  }

  function firePulse() {
    const p = state.player;
    if (state.pulseCooldown > 0) return 0;
    state.pulseCooldown = PULSE_COOLDOWN;
    let events = EVENT_PULSE;
    state.particles.push({
      x: p.x, y: p.y, vx: 0, vy: 0, life: 0.45, maxLife: 0.45,
      size: PULSE_RADIUS, color: '#9fe8ff', grav: 0, ring: true,
    });
    for (const e of [...state.entities]) {
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d > PULSE_RADIUS + e.r) continue;
      if (e.kind === 'seed') {
        events |= catchSeed(e);
        state.entities.splice(state.entities.indexOf(e), 1);
      } else if (e.kind === 'shard') {
        const a = Math.atan2(e.y - p.y, e.x - p.x);
        e.vx = Math.cos(a) * 520;
        e.vy = Math.sin(a) * 520 - 120;
      } else if (e.kind === 'power') {
        events |= applyPower(e.power);
        state.entities.splice(state.entities.indexOf(e), 1);
      }
    }
    return events;
  }

  function stepPlayer(dt, input) {
    const p = state.player;
    const ACCEL = 2600;
    const MAXV = 430;
    const dir = input.direction();
    if (dir) {
      p.vx += dir.x * ACCEL * dt;
      p.vy += dir.y * ACCEL * dt;
    } else {
      const t = input.pointerTarget();
      if (t) {
        const dx = t.x - p.x;
        const dy = t.y - p.y;
        const d = Math.hypot(dx, dy);
        if (d > 6) {
          const sp = Math.min(MAXV, d * 6);
          p.vx += ((dx / d) * sp - p.vx) * Math.min(1, dt * 10);
          p.vy += ((dy / d) * sp - p.vy) * Math.min(1, dt * 10);
        } else {
          p.vx *= Math.max(0, 1 - dt * 8);
          p.vy *= Math.max(0, 1 - dt * 8);
        }
      } else {
        p.vx *= Math.max(0, 1 - dt * 6);
        p.vy *= Math.max(0, 1 - dt * 6);
      }
    }
    const sp = Math.hypot(p.vx, p.vy);
    if (sp > MAXV) {
      p.vx = (p.vx / sp) * MAXV;
      p.vy = (p.vy / sp) * MAXV;
    }
    p.x = Math.max(p.r, Math.min(state.w - p.r, p.x + p.vx * dt));
    p.y = Math.max(p.r, Math.min(groundY() - 8, p.y + p.vy * dt));
    if (p.invuln > 0) p.invuln -= dt;
    if (p.magnet > 0) p.magnet -= dt;
    if (p.slow > 0) p.slow -= dt;
    if (state.pulseCooldown > 0) state.pulseCooldown -= dt;
    // Lantern trail.
    if (sp > 60 && random.next() < 0.6) {
      state.particles.push({
        x: p.x - p.vx * 0.03, y: p.y - p.vy * 0.03,
        vx: random.range(-12, 12), vy: random.range(-12, 12),
        life: 0.5, maxLife: 0.5, size: random.range(3, 7), color: '#ffd76a', grav: 0,
      });
    }
  }

  function stepEntities(dt) {
    const p = state.player;
    const slowFactor = p.slow > 0 ? 0.45 : 1;
    const edt = dt * slowFactor;
    for (const e of [...state.entities]) {
      e.sway += edt * 2;
      e.rot += e.spin * edt;
      e.x += (e.vx + Math.sin(e.sway) * e.swayAmp) * edt;
      e.y += e.vy * edt;
      if (e.vx) e.vx *= Math.max(0, 1 - edt * 1.5);
      // Magnet pulls seeds toward the lantern.
      if (p.magnet > 0 && e.kind === 'seed') {
        const dx = p.x - e.x;
        const dy = p.y - e.y;
        const d = Math.hypot(dx, dy);
        if (d < 300 && d > 1) {
          e.x += (dx / d) * 320 * dt;
          e.y += (dy / d) * 320 * dt;
        }
      }
      if (e.x < e.r) e.x = e.r;
      if (e.x > state.w - e.r) e.x = state.w - e.r;
      if (e.y > groundY() + 4) {
        state.entities.splice(state.entities.indexOf(e), 1);
        if (e.kind === 'seed') {
          state.combo = 0;
          state.mult = 1;
          burst(e.x, groundY(), '#8a93b8', 6, 90);
        }
        continue;
      }
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d < e.r + p.r - 2) {
        if (e.kind === 'seed') {
          state.events |= catchSeed(e);
          state.entities.splice(state.entities.indexOf(e), 1);
        } else if (e.kind === 'power') {
          state.events |= applyPower(e.power);
          state.entities.splice(state.entities.indexOf(e), 1);
        } else if (e.kind === 'shard') {
          state.events |= hitByShard(e);
          state.entities.splice(state.entities.indexOf(e), 1);
          if (state.over) return;
        }
      }
    }
  }

  function stepFx(dt) {
    for (const pt of [...state.particles]) {
      pt.life -= dt;
      if (pt.life <= 0) {
        state.particles.splice(state.particles.indexOf(pt), 1);
        continue;
      }
      pt.vy += (pt.grav || 0) * dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
    }
    for (const pp of [...state.popups]) {
      pp.life -= dt;
      pp.y -= 34 * dt;
      if (pp.life <= 0) state.popups.splice(state.popups.indexOf(pp), 1);
    }
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 40);
    if (state.flash > 0) state.flash = Math.max(0, state.flash - dt * 1.6);
    if (state.banner) {
      state.banner.timer -= dt;
      if (state.banner.timer <= 0) state.banner = null;
    }
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) {
        state.combo = 0;
        state.mult = 1;
      }
    }
  }

  function stepSpawns(dt) {
    const wave = state.wave;
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnTimer = Math.max(0.32, 0.95 - wave * 0.07) * random.range(0.75, 1.25);
      const shardChance = Math.min(0.42, 0.16 + wave * 0.035);
      spawn(random.next() < shardChance ? 'shard' : 'seed');
    }
    powerTimer -= dt;
    if (powerTimer <= 0) {
      powerTimer = random.range(11, 17);
      const kind = random.next() < 0.14 ? 'heart' : random.pick(POWER_KINDS.slice(0, 3));
      spawn(kind);
    }
  }

  function checkWave() {
    if (state.seedsCaught < state.needed || state.over || state.won) return 0;
    const bonus = waveClearBonus(state.wave);
    state.score += bonus;
    if (state.wave >= WAVES) {
      state.won = true;
      popup(state.w / 2, state.h / 2 - 60, `DAWN BONUS +${bonus}`, '#ffe9a8', 24);
      return EVENT_WAVE | EVENT_WIN;
    }
    state.wave += 1;
    state.seedsCaught = 0;
    state.needed = seedsNeeded(state.wave);
    state.banner = { text: `WAVE ${state.wave}`, sub: `Dawn draws closer  ·  bonus +${bonus}`, timer: 2.2 };
    burst(state.w / 2, state.h / 2, '#ffd76a', 30, 300);
    return EVENT_WAVE;
  }

  function reset() {
    state.score = 0;
    state.lives = LIVES;
    state.combo = 0;
    state.mult = 1;
    state.comboTimer = 0;
    state.wave = 1;
    state.seedsCaught = 0;
    state.needed = seedsNeeded(1);
    state.player.x = state.w / 2;
    state.player.y = state.h * 0.72;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.invuln = 0;
    state.player.shield = false;
    state.player.magnet = 0;
    state.player.slow = 0;
    state.pulseCooldown = 0;
    state.entities = [];
    state.particles = [];
    state.popups = [];
    state.shake = 0;
    state.flash = 0;
    state.banner = { text: 'WAVE 1', sub: 'Gather the falling star-seeds', timer: 2.2 };
    state.over = false;
    state.won = false;
    spawnTimer = 0.6;
    powerTimer = 12;
  }

  makeStars();
  reset();

  return {
    state,
    reset,
    resize(w, h) {
      state.w = w;
      state.h = h;
      state.player.x = Math.min(state.player.x, w - state.player.r);
      state.player.y = Math.min(state.player.y, groundY() - 8);
      makeStars();
    },
    firePulse,
    // Advance one fixed step. In title mode the sky just drifts: seeds fall
    // and fade, nothing can be caught and nothing can hurt.
    step(dt, input, titleMode) {
      state.time += dt;
      state.events = 0;
      stepFx(dt);
      if (titleMode) {
        spawnTimer -= dt;
        if (spawnTimer <= 0) {
          spawnTimer = random.range(0.5, 1.1);
          spawn('seed');
        }
        for (const e of [...state.entities]) {
          e.sway += dt * 2;
          e.rot += e.spin * dt;
          e.x += Math.sin(e.sway) * e.swayAmp * dt;
          e.y += e.vy * dt * 0.6;
          if (e.y > groundY() + 4) {
            burst(e.x, groundY(), '#8a93b8', 5, 70);
            state.entities.splice(state.entities.indexOf(e), 1);
          }
        }
        return 0;
      }
      if (state.over || state.won) return 0;
      stepPlayer(dt, input);
      stepSpawns(dt);
      stepEntities(dt);
      state.events |= checkWave();
      const ev = state.events;
      state.events = 0;
      return ev;
    },
  };
}
