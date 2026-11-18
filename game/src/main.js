// Starfall Shepherd — boot and the one loop. Input is read every frame, the
// world advances in fixed 1/60 s steps, and the renderer paints what is
// there. Five screens: title, play, paused, game over and victory.
// ?seed=N fixes the falling pattern. ?shot=start|play|end stages that scene
// for a screenshot instead of running the loop.
import { BEST_KEY, LIVES, STEP } from './config.js';
import { createRandom } from './random.js';
import { createAudio } from './audio.js';
import { createWorld, EVENT_CATCH, EVENT_HIT, EVENT_OVER, EVENT_POWER, EVENT_PULSE, EVENT_WAVE, EVENT_WIN } from './world.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, ACTION_PULSE, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score lasts this visit.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  const size = renderer.resize();
  world.resize(size.w, size.h);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, false);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function fit() {
    const size = renderer.resize();
    world.resize(size.w, size.h);
  }
  fit();
  window.addEventListener('resize', fit);

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    audio.unlock();
    audio.startPad();
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce(`Playing. ${LIVES} lives. Gather the star-seeds, dodge the void shards.`);
  }

  function endGame(won) {
    screen = won ? SCREEN_WIN : SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    announce(
      won
        ? `Dawn restored! Score ${world.state.score}. Best ${best}.`
        : `Game over. Score ${world.state.score}. Best ${best}.`,
    );
  }

  function playEvents(events) {
    if (events & EVENT_CATCH) audio.pluck(world.state.lastCatchCombo);
    if (events & EVENT_PULSE) audio.pulse();
    if (events & EVENT_HIT) audio.thud();
    if (events & EVENT_POWER) audio.power();
    if (events & EVENT_WAVE) audio.fanfare();
    if (events & EVENT_WIN) audio.win();
    if (events & EVENT_OVER) endGame(false);
    else if (events & EVENT_WIN) endGame(true);
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMute();
      if (!muted && screen === SCREEN_PLAY) audio.startPad();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    if (actions & ACTION_CONFIRM) audio.unlock();
    if (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_WIN) {
      if (actions & ACTION_CONFIRM) {
        audio.click();
        startGame();
      }
      return;
    }
    if (screen === SCREEN_PAUSED) {
      if (actions & (ACTION_PAUSE | ACTION_CONFIRM)) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
      return;
    }
    if (screen === SCREEN_PLAY) {
      if (actions & ACTION_PAUSE) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (actions & ACTION_PULSE) {
        playEvents(world.firePulse());
      }
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      world.step(STEP, input, true);
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    playEvents(world.step(STEP, input, false));
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best, audio.muted);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Starfall Shepherd. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
