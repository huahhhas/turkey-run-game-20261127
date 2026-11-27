// Gobble Dash — the things in the world: obstacles to dodge, food to grab,
// haystacks to hide in, and the little feather-burst particles when the
// turkey eats or stumbles. Plain data plus small update helpers; the rules
// that decide what they mean live in world.js.

import { FIELD, OBSTACLE, PICKUP } from './tuning.js';
import { range, pick } from './rng.js';

export const KIND_OVEN = 'oven';
export const KIND_KNIFE = 'knife';
export const KIND_FENCE = 'fence';
export const KIND_PUMPKIN = 'pumpkin';
export const KIND_CORN = 'corn';
export const KIND_FEATHER = 'feather';
export const KIND_HAY = 'hay';

/** A fresh obstacle at the right edge of the field. */
export function spawnObstacle(rng, zone) {
  const roll = rng();
  let kind = KIND_FENCE;
  let w = OBSTACLE.fenceWidth;
  let h = OBSTACLE.fenceHeight;
  if (roll < zone.ovenChance) {
    kind = KIND_OVEN; w = OBSTACLE.ovenWidth; h = OBSTACLE.ovenHeight;
  } else if (roll < zone.ovenChance + 0.3) {
    kind = KIND_KNIFE; w = OBSTACLE.knifeWidth; h = OBSTACLE.knifeHeight;
  } else if (roll < zone.ovenChance + 0.42) {
    kind = KIND_PUMPKIN; w = OBSTACLE.pumpkinWidth; h = OBSTACLE.pumpkinHeight;
  }
  return {
    kind, x: FIELD.width + 40, y: FIELD.groundY - h, width: w, height: h,
    active: true, passed: false,
    // Knives swing: their blade angle oscillates, so the danger window moves.
    swing: kind === KIND_KNIFE ? rng() * Math.PI * 2 : 0,
    swingSpeed: 2.2 + rng() * 1.6,
  };
}

/** A fresh pickup (corn, sometimes a rare feather) floating over the ground. */
export function spawnPickup(rng) {
  const feather = rng() < 0.16;
  const size = feather ? PICKUP.featherSize : PICKUP.cornSize;
  return {
    kind: feather ? KIND_FEATHER : KIND_CORN,
    x: FIELD.width + 40,
    // Corn bobs low enough to grab on the run; feathers float at jump height.
    y: feather ? FIELD.groundY - 150 - rng() * 60 : FIELD.groundY - 46 - rng() * 90,
    width: size, height: size, active: true, bob: rng() * Math.PI * 2,
  };
}

/** A haystack the turkey can duck behind to shake the farmer off. */
export function spawnHay(rng) {
  const w = 110 + rng() * 40;
  const h = 78 + rng() * 18;
  return {
    kind: KIND_HAY, x: FIELD.width + 40, y: FIELD.groundY - h,
    width: w, height: h, active: true, used: false,
  };
}

export function spawnParticle(rng, x, y, colour) {
  return {
    x, y,
    vx: range(rng, -140, 140), vy: range(rng, -260, -60),
    life: 0.5 + rng() * 0.4, age: 0, size: 3 + rng() * 5, colour,
  };
}

/** Move everything left by the scroll distance; drop what left the screen. */
export function scrollList(list, dx) {
  for (const item of list) {
    if (!item.active) continue;
    item.x -= dx;
    if (item.x + item.width < -60) item.active = false;
  }
}

/** Advance knife swings and pickup bobbing. */
export function animateList(list, dt) {
  for (const item of list) {
    if (!item.active) continue;
    if (item.kind === KIND_KNIFE) item.swing += item.swingSpeed * dt;
    if (item.kind === KIND_CORN || item.kind === KIND_FEATHER) item.bob += dt * 4;
  }
}

export function updateParticles(particles, dt) {
  for (const p of particles) {
    p.age += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 900 * dt;
  }
  return particles.filter((p) => p.age < p.life);
}

/** Axis-aligned overlap test between two boxes. */
export function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

/** The turkey's current body box (shorter while ducking). */
export function turkeyBox(turkey) {
  const h = turkey.ducking ? 34 : turkey.height;
  return {
    x: turkey.x + 6, y: turkey.y + (turkey.height - h),
    width: turkey.width - 12, height: h,
  };
}
