// Gobble Dash — boot, fixed-step loop, screen flow and screenshot mode.
// Live play: title -> play -> caught/escaped -> restart. Screenshot mode:
// ?shot=title|play|kitchen|caught|escaped&seed=N stages one deterministic
// frame and stops, so a headless browser can capture it.

import { FIELD, STEP, BEST_KEY } from './tuning.js';
import { createInput, KEYS } from './input.js';
import {
  SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_CAUGHT,
  SCREEN_ESCAPED, createWorld, startRun, resetWorld, stepPlay,
} from './world.js';
import { draw } from './draw.js';
import { stageShot } from './shots.js';
import { sfx } from './audio.js';

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const shotSeed = Number(params.get('seed') || '7') >>> 0 || 7;

const world = createWorld(shotSeed);
try {
  world.best = Number(window.localStorage.getItem(BEST_KEY) || '0') || 0;
} catch {
  world.best = 0;
}

function saveBest() {
  if (world.score > world.best) {
    world.best = Math.floor(world.score);
    try {
      window.localStorage.setItem(BEST_KEY, String(world.best));
    } catch {
      /* best score is a nicety, not a requirement */
    }
  }
}

function announce(text) {
  if (statusEl) statusEl.textContent = text;
}

/** Fit the fixed 1280x720 field onto the canvas, letterboxed. */
function fitCanvas() {
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  canvas.width = Math.round(FIELD.width * scale);
  canvas.height = Math.round(FIELD.height * scale);
  canvas.style.width = canvas.width + 'px';
  canvas.style.height = canvas.height + 'px';
}

// Mouse position in logical field coordinates (the canvas is scaled, so
// convert from canvas pixels with the field scale).
function logicalMouse(input) {
  return {
    x: input.mouseX * (FIELD.width / canvas.width),
    y: input.mouseY * (FIELD.height / canvas.height),
  };
}

const input = createInput(canvas);

function inRect(m, x, y, w, h) {
  return m.x >= x && m.x <= x + w && m.y >= y && m.y <= y + h;
}

let accumulator = 0;
let lastTime = performance.now();
let shotDone = false;

function frame(now) {
  const dt = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;
  const mouse = logicalMouse(input);

  if (world.screen === SCREEN_TITLE) {
    if (input.takePress(KEYS.start) || input.takeClick() || inRect(mouse, 520, 480, 240, 56) && input.mouseDown) {
      sfx.click();
      startRun(world);
      announce('Run started. Jump the ovens and knives, eat corn, reach the forest.');
    }
  } else if (world.screen === SCREEN_PLAY) {
    if (input.takePress(KEYS.pause) || (inRect(mouse, 1230, FIELD.height - 52, 32, 36) && input.takeClick())) {
      world.screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (input.takePress(KEYS.mute) || (inRect(mouse, 1180, FIELD.height - 52, 40, 36) && input.takeClick())) {
      world.muted = sfx.toggleMute();
    } else {
      accumulator += dt;
      let guard = 0;
      while (accumulator >= STEP && guard < 8) {
        accumulator -= STEP;
        guard += 1;
        const jump = input.jumpHeld;
        const duck = input.duckHeld;
        stepPlay(world, { jump, duck });
        if (world.screen === SCREEN_CAUGHT || world.screen === SCREEN_ESCAPED) {
          saveBest();
          announce(world.screen === SCREEN_CAUGHT
            ? `Caught! Score ${Math.floor(world.score)}. Press R to run again.`
            : `Escaped! Score ${Math.floor(world.score)}. Press R to run again.`);
          break;
        }
      }
    }
  } else if (world.screen === SCREEN_PAUSED) {
    if (input.takePress(KEYS.pause) || input.takeClick()) {
      world.screen = SCREEN_PLAY;
      announce('Resumed.');
    }
  } else if (world.screen === SCREEN_CAUGHT || world.screen === SCREEN_ESCAPED) {
    if (input.takePress(KEYS.restart) || input.takeClick()) {
      sfx.click();
      startRun(world);
      announce('New run started.');
    }
  }

  // Render: scale the fixed field onto the canvas.
  ctx.setTransform(canvas.width / FIELD.width, 0, 0, canvas.height / FIELD.height, 0, 0);
  draw(ctx, world, mouse);
  input.endFrame();
  if (!shotDone) requestAnimationFrame(frame);
}

if (shotName) {
  // Screenshot mode: stage one deterministic frame, draw it once, stop.
  fitCanvas();
  const staged = stageShot(shotName, world, shotSeed);
  world.screen = staged.screen;
  if (staged.screen === SCREEN_CAUGHT || staged.screen === SCREEN_ESCAPED) saveBest();
  const mouse = { x: -1, y: -1 };
  ctx.setTransform(canvas.width / FIELD.width, 0, 0, canvas.height / FIELD.height, 0, 0);
  draw(ctx, world, mouse);
  shotDone = true;
  document.title = 'Gobble Dash — shot ' + shotName;
} else {
  fitCanvas();
  window.addEventListener('resize', fitCanvas);
  announce('Gobble Dash. Press Space or click to start the run.');
  requestAnimationFrame(frame);
}
