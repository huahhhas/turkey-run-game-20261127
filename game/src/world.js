// Gobble Dash — the game itself: states, the chase, the zones, scoring and
// the rules that decide caught vs escaped. Rendering lives in draw.js;
// this file only moves numbers around, so the screenshot stager can run it
// headless with a fixed step and get the same frame every time.

import {
  FIELD, STEP, ESCAPE_DISTANCE, TURKEY, RUN, FARMER, LIVES,
  ZONES, PICKUP, PALETTE,
} from './tuning.js';
import { makeRng, range } from './rng.js';
import {
  KIND_OVEN, KIND_KNIFE, KIND_FENCE, KIND_PUMPKIN, KIND_CORN, KIND_FEATHER,
  KIND_HAY, spawnObstacle, spawnPickup, spawnHay, spawnParticle,
  scrollList, animateList, updateParticles, overlaps, turkeyBox,
} from './entities.js';
import { sfx } from './audio.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_ESCAPED = 'escaped';

/** Bit flags a step can report to its caller. */
export const EVENT_OVER = 1;
export const EVENT_STUMBLE = 2;
export const EVENT_EAT = 4;

export function zoneFor(distance) {
  for (const zone of ZONES) if (distance < zone.to) return zone;
  return ZONES[ZONES.length - 1];
}

export function createWorld(seed) {
  const rng = makeRng(seed >>> 0 || 1);
  return {
    rng,
    screen: SCREEN_TITLE,
    time: 0,
    distance: 0,
    score: 0,
    lives: LIVES,
    gap: FARMER.startGap,
    speed: RUN.baseSpeed,
    turkey: {
      x: TURKEY.x, y: FIELD.groundY - TURKEY.height,
      width: TURKEY.width, height: TURKEY.height,
      vy: 0, grounded: true, ducking: false, hidden: false,
      invulnerable: 0, runPhase: 0, stumble: 0,
    },
    farmer: { x: -40, runPhase: 0, searching: false, searchTimer: 0 },
    obstacles: [],
    pickups: [],
    haystacks: [],
    particles: [],
    obstacleTimer: 0.8,
    pickupTimer: 1.2,
    hayTimer: 6,
    cornEaten: 0,
    feathersEaten: 0,
    dodged: 0,
    best: 0,
    message: '',
    messageTimer: 0,
    muted: false,
  };
}

export function resetWorld(world, seed) {
  const fresh = createWorld(seed);
  const best = world.best;
  Object.assign(world, fresh);
  world.best = best;
  world.screen = SCREEN_PLAY;
}

/** Start a run from the title screen. */
export function startRun(world) {
  resetWorld(world, (Math.random() * 0xffffffff) >>> 0);
}

function flash(world, text) {
  world.message = text;
  world.messageTimer = 1.6;
}

function burst(world, x, y, colour, count) {
  for (let i = 0; i < count; i += 1) {
    world.particles.push(spawnParticle(world.rng, x, y, colour));
  }
}

function stumble(world) {
  const t = world.turkey;
  if (t.invulnerable > 0 || t.hidden) return 0;
  world.lives -= 1;
  world.gap = Math.max(FARMER.catchGap, world.gap - FARMER.stumbleCost);
  t.invulnerable = 1.6;
  t.stumble = 0.5;
  sfx.stumble();
  burst(world, t.x + t.width / 2, t.y + 10, PALETTE.feather, 14);
  flash(world, world.lives > 0 ? 'Ouch! The farmer is closing in!' : '');
  if (world.lives <= 0) {
    world.screen = SCREEN_CAUGHT;
    sfx.caught();
    return EVENT_OVER | EVENT_STUMBLE;
  }
  return EVENT_STUMBLE;
}

function eat(world, item) {
  item.active = false;
  const t = world.turkey;
  if (item.kind === KIND_CORN) {
    world.score += PICKUP.cornPoints;
    world.cornEaten += 1;
    world.gap = Math.min(FARMER.startGap, world.gap + FARMER.cornBonus);
    sfx.corn();
    burst(world, item.x + 13, item.y + 13, PALETTE.corn, 8);
  } else {
    world.score += PICKUP.featherPoints;
    world.feathersEaten += 1;
    world.lives = Math.min(LIVES, world.lives + 1);
    sfx.feather();
    burst(world, item.x + 12, item.y + 12, PALETTE.feather, 12);
    flash(world, 'Golden feather! +1 life');
  }
  return EVENT_EAT;
}

/**
 * One fixed step of play. `input` is { jump, duck } for this step.
 * Returns a bitmask of EVENT_* flags. Never called while on a menu screen.
 */
export function stepPlay(world, input, dt = STEP) {
  const t = world.turkey;
  const zone = zoneFor(world.distance);
  world.time += dt;

  // Speed grows with the zone; the world scrolls past the turkey.
  const targetSpeed = Math.min(
    RUN.maxSpeed, RUN.baseSpeed + zone.speed,
  );
  world.speed += (targetSpeed - world.speed) * dt * 0.8;
  const dx = world.speed * dt;
  world.distance += (world.speed / RUN.baseSpeed) * RUN.metresPerSecond * dt;
  world.score += dt * 2;

  // --- Turkey: jump, gravity, duck ---
  const wantDuck = input.duck && t.grounded;
  t.ducking = wantDuck;
  if (input.jump && t.grounded && !t.ducking) {
    t.vy = -TURKEY.jumpSpeed;
    t.grounded = false;
    sfx.jump();
  }
  if (!t.grounded) {
    // Holding jump while falling glides: the turkey hangs in the air a
    // little longer, so an early jump can still clear a tall oven.
    const g = input.jump && t.vy > 0 ? TURKEY.gravity * 0.5 : TURKEY.gravity;
    t.vy += g * dt;
    t.y += t.vy * dt;
    if (t.y >= FIELD.groundY - t.height) {
      t.y = FIELD.groundY - t.height;
      t.vy = 0;
      t.grounded = true;
    }
  }
  t.runPhase += dt * (t.grounded ? world.speed / 28 : 4);
  if (t.invulnerable > 0) t.invulnerable -= dt;
  if (t.stumble > 0) t.stumble -= dt;

  // --- Hiding: ducking behind a haystack makes the turkey invisible ---
  t.hidden = false;
  for (const hay of world.haystacks) {
    if (!hay.active) continue;
    if (t.ducking && overlaps(turkeyBox(t), hay)) {
      t.hidden = true;
      if (!hay.used) {
        hay.used = true;
        world.gap = Math.min(FARMER.startGap, world.gap + 18);
        world.score += 15;
        sfx.hide();
        flash(world, 'Hidden in the hay! The farmer lost you (+15)');
      }
      break;
    }
  }

  // --- The farmer: closes in on mistakes, loses ground on clean running ---
  const f = world.farmer;
  f.runPhase += dt * 9;
  if (t.hidden) {
    // While hidden the farmer stops, looks around, then gives ground.
    f.searching = true;
    f.searchTimer += dt;
    if (f.searchTimer > 1.2) {
      f.searching = false;
      f.searchTimer = 0;
      world.gap = Math.min(FARMER.startGap, world.gap + 6);
    }
  } else {
    f.searching = false;
    f.searchTimer = 0;
    world.gap += FARMER.recoverPerSecond * dt;
    if (world.gap > FARMER.startGap) world.gap = FARMER.startGap;
  }
  // The farmer's screen position follows the gap: 100 = far left, 0 = caught.
  f.x = TURKEY.x - 90 - (world.gap / FARMER.startGap) * 220;
  if (world.gap <= FARMER.catchGap) {
    world.screen = SCREEN_CAUGHT;
    sfx.caught();
    return EVENT_OVER;
  }

  // --- Spawning (obstacles keep a minimum spacing so a jump can always
  // land in a gap before the next one arrives) ---
  world.obstacleTimer -= dt;
  if (world.obstacleTimer <= 0) {
    const crowded = world.obstacles.some((o) => o.active && o.x > FIELD.width - 400);
    if (!crowded) {
      world.obstacles.push(spawnObstacle(world.rng, zone));
      world.obstacleTimer = zone.interval * range(world.rng, 0.85, 1.25);
    } else {
      world.obstacleTimer = 0.12;
    }
  }
  world.pickupTimer -= dt;
  if (world.pickupTimer <= 0) {
    world.pickups.push(spawnPickup(world.rng));
    world.pickupTimer = PICKUP.interval * range(world.rng, 0.8, 1.3);
  }
  world.hayTimer -= dt;
  if (world.hayTimer <= 0) {
    world.haystacks.push(spawnHay(world.rng));
    world.hayTimer = range(world.rng, 7, 11);
  }

  // --- Scroll + animate ---
  scrollList(world.obstacles, dx);
  scrollList(world.pickups, dx);
  scrollList(world.haystacks, dx);
  animateList(world.obstacles, dt);
  animateList(world.pickups, dt);
  world.particles = updateParticles(world.particles, dt);
  if (world.messageTimer > 0) world.messageTimer -= dt;

  // --- Collisions ---
  const box = turkeyBox(t);
  let events = 0;
  for (const ob of world.obstacles) {
    if (!ob.active) continue;
    // A knife's swinging blade is narrower than its box at the extremes.
    const hitBox = ob.kind === KIND_KNIFE
      ? { x: ob.x + 8 + Math.sin(ob.swing) * 10, y: ob.y + 6, width: ob.width - 16, height: ob.height - 6 }
      : ob;
    if (!ob.passed && ob.x + ob.width < t.x) {
      ob.passed = true;
      world.dodged += 1;
      world.score += 2;
    }
    if (overlaps(box, hitBox)) {
      ob.active = false;
      events |= stumble(world);
      if (world.screen !== SCREEN_PLAY) return events;
    }
  }
  for (const item of world.pickups) {
    if (!item.active) continue;
    const bobY = item.y + Math.sin(item.bob) * 5;
    if (overlaps(box, { x: item.x, y: bobY, width: item.width, height: item.height })) {
      events |= eat(world, item);
    }
  }

  // --- Escape! ---
  if (world.distance >= ESCAPE_DISTANCE) {
    world.screen = SCREEN_ESCAPED;
    world.score += 500;
    sfx.escaped();
    return events | EVENT_OVER;
  }
  return events;
}
