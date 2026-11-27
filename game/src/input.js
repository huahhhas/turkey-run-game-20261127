// Gobble Dash — keyboard and mouse input. The game reads a plain state
// object each fixed step: held keys, plus edge-triggered presses that the
// world consumes once (jump, start, restart, pause).

export const KEYS = {
  jump: ['Space', 'ArrowUp', 'KeyW'],
  duck: ['ArrowDown', 'KeyS'],
  start: ['Space', 'Enter'],
  restart: ['KeyR', 'Space', 'Enter'],
  pause: ['KeyP', 'Escape'],
  mute: ['KeyM'],
};

export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  let mouseX = 0;
  let mouseY = 0;
  let mousePressed = false;
  let mouseDown = false;

  function codeOf(event) {
    return event.code;
  }

  window.addEventListener('keydown', (event) => {
    if (KEYS.jump.includes(event.code) || event.code === 'Space') event.preventDefault();
    if (!event.repeat) pressed.add(codeOf(event));
    held.add(codeOf(event));
  });
  window.addEventListener('keyup', (event) => held.delete(codeOf(event)));
  window.addEventListener('blur', () => { held.clear(); mouseDown = false; });

  canvas.addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = (event.clientX - rect.left) * (canvas.width / rect.width);
    mouseY = (event.clientY - rect.top) * (canvas.height / rect.height);
  });
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = (event.clientX - rect.left) * (canvas.width / rect.width);
    mouseY = (event.clientY - rect.top) * (canvas.height / rect.height);
    mousePressed = true;
    mouseDown = true;
    event.preventDefault();
  });
  window.addEventListener('pointerup', () => { mouseDown = false; });

  return {
    get mouseX() { return mouseX; },
    get mouseY() { return mouseY; },
    get mouseDown() { return mouseDown; },
    /** True while any jump key or the mouse button is held. */
    get jumpHeld() {
      return KEYS.jump.some((k) => held.has(k)) || mouseDown;
    },
    /** True while any duck key is held. */
    get duckHeld() {
      return KEYS.duck.some((k) => held.has(k));
    },
    /** Consume one press of any of the given codes (or a mouse click). */
    takePress(codes) {
      for (const code of codes) {
        if (pressed.has(code)) { pressed.delete(code); return true; }
      }
      if (mousePressed && codes.includes('Mouse')) { mousePressed = false; return true; }
      return false;
    },
    /** A mouse click counts as a press for start/restart buttons. */
    takeClick() {
      if (mousePressed) { mousePressed = false; return true; }
      return false;
    },
    /** Drop un-consumed presses at the end of a frame. */
    endFrame() { pressed.clear(); mousePressed = false; },
  };
}
