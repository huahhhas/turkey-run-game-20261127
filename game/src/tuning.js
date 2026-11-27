// Gobble Dash — tuning: every number and colour in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to
// the window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720, groundY: 600 };

/** Fixed simulation step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

/** Metres the turkey must cover to reach the forest and escape. */
export const ESCAPE_DISTANCE = 1200;

export const TURKEY = {
  x: 300,
  width: 64,
  height: 58,
  jumpSpeed: 950,
  gravity: 2000,
  duckHeight: 34,
};

export const RUN = {
  baseSpeed: 330, // px per second of world scroll
  speedPerZone: 55,
  maxSpeed: 560,
  /** Metres covered per second at base speed. */
  metresPerSecond: 9,
};

/** The farmer starts this far behind (in "gap" units) and closes in on mistakes. */
export const FARMER = {
  startGap: 100,
  catchGap: 0,
  /** Gap lost when the turkey stumbles into an obstacle. */
  stumbleCost: 26,
  /** Gap regained per second of clean running. */
  recoverPerSecond: 3.2,
  /** Gap regained per corn cob eaten. */
  cornBonus: 4,
  /** How fast the farmer himself closes in while the turkey hides. */
  searchPerSecond: 9,
};

export const LIVES = 3;

/** Zones: name, distance span in metres, spawn pacing and speed. */
export const ZONES = [
  { name: 'Farmyard', from: 0, to: 400, interval: 1.15, speed: 0, ovenChance: 0.12 },
  { name: 'Cornfield', from: 400, to: 800, interval: 0.95, speed: 55, ovenChance: 0.22 },
  { name: 'The Kitchen', from: 800, to: 1200, interval: 0.78, speed: 110, ovenChance: 0.38 },
];

export const OBSTACLE = {
  ovenWidth: 78,
  ovenHeight: 76,
  knifeWidth: 84,
  knifeHeight: 34,
  fenceWidth: 56,
  fenceHeight: 62,
  pumpkinWidth: 52,
  pumpkinHeight: 40,
};

export const PICKUP = {
  cornSize: 26,
  featherSize: 24,
  cornPoints: 10,
  featherPoints: 25,
  interval: 1.9,
};

export const PALETTE = {
  skyTop: '#f7b267',
  skyMid: '#f4845f',
  skyLow: '#e3645a',
  sun: '#ffd97a',
  hillFar: '#b5651d',
  hillNear: '#8a5a2b',
  ground: '#6b4423',
  groundTop: '#a4713b',
  grass: '#7d9b4a',
  turkeyBody: '#8a5230',
  turkeyBelly: '#c98a4b',
  tail: ['#a0522d', '#d2691e', '#e8a33c', '#7a3b1e'],
  head: '#e8e0d0',
  beak: '#e8a33c',
  wattle: '#e5534b',
  farmerShirt: '#4a6fa5',
  farmerOveralls: '#3b4a6b',
  farmerHat: '#d9c27a',
  oven: '#3a3f4a',
  ovenDoor: '#22252d',
  ovenGlow: '#ff9a3c',
  knifeBlade: '#d7dce3',
  knifeHandle: '#5a3a22',
  fence: '#7a5230',
  pumpkin: '#e07b2a',
  corn: '#f2c94c',
  feather: '#f4ead8',
  hay: '#d9b25f',
  panel: 'rgba(43, 26, 12, 0.82)',
  text: '#fff6e6',
  muted: '#e8c9a0',
  danger: '#ff5a4e',
  good: '#9be15d',
};

export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

/** Best score kept between visits (this browser only). */
export const BEST_KEY = 'gobble-dash.best';
