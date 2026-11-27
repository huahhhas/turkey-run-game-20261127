// Gobble Dash — screenshot scenes behind ?shot=title|play|kitchen|caught|escaped.
// Each scene plays the real rules forward from a fresh world for a fixed
// number of steps, steered by a simple autopilot (jump when an obstacle is
// close, duck into hay when the farmer is near), so the frame is what a
// short game really looks like and the same seed always gives the same frame.

import { STEP, FIELD } from './tuning.js';
import {
  SCREEN_TITLE, SCREEN_PLAY, SCREEN_CAUGHT, SCREEN_ESCAPED,
  createWorld, resetWorld, stepPlay,
} from './world.js';

const TITLE_SECONDS = 4;
const PLAY_SECONDS = 14;
const KITCHEN_SECONDS = 95;
const ESCAPED_LIMIT_SECONDS = 600;
const CAUGHT_LIMIT_SECONDS = 600;
const SAMPLE = 1 / 30;

/** Distance (px) to the nearest obstacle ahead of the turkey. */
function nearestObstacle(world) {
  const t = world.turkey;
  let best = null;
  let bestX = Infinity;
  for (const ob of world.obstacles) {
    if (!ob.active) continue;
    if (ob.x + ob.width <= t.x) continue;
    if (ob.x < bestX) { bestX = ob.x; best = ob; }
  }
  return best;
}

/** Jump when an obstacle is close and the turkey is grounded; hold the jump
 *  (glide) while an obstacle is still ahead; duck into hay. */
function autopilot(world, brave) {
  const t = world.turkey;
  const ob = nearestObstacle(world);
  let jump = false;
  let duck = false;
  if (ob) {
    const gapPx = ob.x - (t.x + t.width);
    const reach = brave ? 170 : 140;
    if (t.grounded && gapPx < reach && gapPx > -20) jump = true;
    // Glide: keep holding jump while airborne and the obstacle is still ahead.
    if (!t.grounded && gapPx < 260 && gapPx > -80) jump = true;
  }
  // Duck when a haystack overlaps the turkey and the farmer is close.
  if (t.grounded && world.gap < 55) {
    for (const hay of world.haystacks) {
      if (hay.active && hay.x < t.x + t.width && hay.x + hay.width > t.x) {
        duck = true;
        break;
      }
    }
  }
  return { jump, duck };
}

/** A pilot that never jumps: it stumbles until the farmer catches it. */
function clumsyPilot(world) {
  return { jump: false, duck: false };
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * Unknown names stage the title scene.
 */
export function stageShot(name, world, seed) {
  resetWorld(world, seed);
  if (name === 'title' || !name) {
    world.screen = SCREEN_PLAY;
    for (let i = 0; i < TITLE_SECONDS / STEP; i += 1) {
      stepPlay(world, autopilot(world, true));
      if (world.screen !== SCREEN_PLAY) break;
    }
    // Title shows the world idling behind the panel: keep the run going.
    world.screen = SCREEN_TITLE;
    return { screen: SCREEN_TITLE };
  }
  if (name === 'play') {
    world.screen = SCREEN_PLAY;
    for (let i = 0; i < PLAY_SECONDS / STEP; i += 1) {
      stepPlay(world, autopilot(world, true));
      if (world.screen !== SCREEN_PLAY) break;
    }
    return { screen: world.screen };
  }
  if (name === 'kitchen') {
    world.screen = SCREEN_PLAY;
    for (let i = 0; i < KITCHEN_SECONDS / STEP; i += 1) {
      stepPlay(world, autopilot(world, true));
      if (world.screen !== SCREEN_PLAY) break;
    }
    return { screen: world.screen };
  }
  if (name === 'caught') {
    world.screen = SCREEN_PLAY;
    for (let i = 0; i < CAUGHT_LIMIT_SECONDS / STEP; i += 1) {
      stepPlay(world, clumsyPilot(world));
      if (world.screen !== SCREEN_PLAY) break;
    }
    return { screen: world.screen === SCREEN_PLAY ? SCREEN_CAUGHT : world.screen };
  }
  if (name === 'escaped') {
    world.screen = SCREEN_PLAY;
    for (let i = 0; i < ESCAPED_LIMIT_SECONDS / STEP; i += 1) {
      stepPlay(world, autopilot(world, true));
      if (world.screen !== SCREEN_PLAY) break;
    }
    return { screen: world.screen === SCREEN_PLAY ? SCREEN_ESCAPED : world.screen };
  }
  return { screen: SCREEN_TITLE };
}
