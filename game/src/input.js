// Keyboard + mouse, edge-triggered actions. WASD or arrows steer, the mouse
// steers by pointing, Space or click fires the pulse, P pauses, M mutes.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_PULSE = 4;
export const ACTION_MUTE = 8;

const KEYMAP = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
};

export function createInput(canvas) {
  const keys = new Set();
  let actions = 0;
  let mouse = { x: 0, y: 0, active: false, down: false };
  let lastMouseMove = 0;

  function onKeyDown(e) {
    if (e.code === 'Space' || e.code === 'Enter') {
      actions |= ACTION_CONFIRM | ACTION_PULSE;
      e.preventDefault();
    } else if (e.code === 'KeyP' || e.code === 'Escape') {
      actions |= ACTION_PAUSE;
    } else if (e.code === 'KeyM') {
      actions |= ACTION_MUTE;
    }
    const dir = KEYMAP[e.code];
    if (dir) {
      keys.add(dir);
      e.preventDefault();
    }
  }
  function onKeyUp(e) {
    const dir = KEYMAP[e.code];
    if (dir) keys.delete(dir);
  }
  function onPointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top, active: true, down: mouse.down };
    lastMouseMove = performance.now();
  }
  function onPointerDown(e) {
    onPointerMove(e);
    mouse.down = true;
    actions |= ACTION_CONFIRM | ACTION_PULSE;
  }
  function onPointerUp() {
    mouse.down = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);

  return {
    takeActions() {
      const a = actions;
      actions = 0;
      return a;
    },
    // Normalised keyboard direction, or null when no key is held.
    direction() {
      const x = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
      const y = (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0);
      if (x === 0 && y === 0) return null;
      const len = Math.hypot(x, y);
      return { x: x / len, y: y / len };
    },
    // Mouse target while the pointer moved recently, else null.
    pointerTarget() {
      if (!mouse.active) return null;
      if (performance.now() - lastMouseMove > 2500) return null;
      return { x: mouse.x, y: mouse.y };
    },
    mouseDown() {
      return mouse.down;
    },
  };
}
