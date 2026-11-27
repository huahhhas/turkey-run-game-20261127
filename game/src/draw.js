// Gobble Dash — everything on screen, drawn in code. Autumn palette, flat
// shapes with soft shading; no image files. The renderer scales the fixed
// 1280x720 field to the canvas, so the game looks the same at any window.

import { FIELD, PALETTE, FONT, ESCAPE_DISTANCE, FARMER } from './tuning.js';
import {
  KIND_OVEN, KIND_KNIFE, KIND_FENCE, KIND_PUMPKIN, KIND_CORN,
  KIND_FEATHER, KIND_HAY,
} from './entities.js';
import {
  SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_CAUGHT,
  SCREEN_ESCAPED, zoneFor,
} from './world.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function text(ctx, str, x, y, size, colour, align = 'center', weight = 'bold') {
  ctx.fillStyle = colour;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = PALETTE.panel;
  rr(ctx, x, y, w, h, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 214, 150, 0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function button(ctx, x, y, w, h, label, hover) {
  ctx.fillStyle = hover ? '#ff9a3c' : '#e07b2a';
  rr(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = '#fff6e6';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, label, x + w / 2, y + h / 2 + 1, 24, '#fff6e6');
}

/** The farm rolling past: hills, barn, fence posts and kitchen rooftops. */
function drawScenery(ctx, world) {
  const zone = zoneFor(world.distance);
  const kitchen = zone.name === 'The Kitchen';
  const g = ctx.createLinearGradient(0, 0, 0, FIELD.height);
  if (kitchen) {
    g.addColorStop(0, '#7a4a3a');
    g.addColorStop(0.55, '#a86a4a');
    g.addColorStop(1, '#c98a5a');
  } else {
    g.addColorStop(0, PALETTE.skyTop);
    g.addColorStop(0.55, PALETTE.skyMid);
    g.addColorStop(1, PALETTE.skyLow);
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);

  // Low autumn sun.
  ctx.fillStyle = PALETTE.sun;
  ellipse(ctx, 1060, 130, 58, 58);
  ctx.fillStyle = 'rgba(255, 217, 122, 0.25)';
  ellipse(ctx, 1060, 130, 86, 86);

  // Drifting clouds.
  ctx.fillStyle = 'rgba(255, 246, 230, 0.75)';
  for (let i = 0; i < 4; i += 1) {
    const cx = ((i * 397 + 200 - world.distance * 6) % 1500 + 1500) % 1500 - 110;
    const cy = 70 + i * 46;
    ellipse(ctx, cx, cy, 62, 20);
    ellipse(ctx, cx + 44, cy + 6, 46, 16);
    ellipse(ctx, cx - 46, cy + 8, 40, 14);
  }

  // Far hills.
  ctx.fillStyle = kitchen ? '#5a3a30' : PALETTE.hillFar;
  ctx.beginPath();
  ctx.moveTo(0, FIELD.groundY);
  for (let x = 0; x <= FIELD.width; x += 80) {
    ctx.lineTo(x, FIELD.groundY - 90 - Math.sin((x + world.distance * 2) * 0.004) * 46);
  }
  ctx.lineTo(FIELD.width, FIELD.groundY);
  ctx.closePath();
  ctx.fill();

  // Barn (farmyard + cornfield) or kitchen rooftops (kitchen zone).
  const bx = 900 - ((world.distance * 14) % 1600);
  if (!kitchen) {
    ctx.fillStyle = '#8a3b2a';
    ctx.fillRect(bx, FIELD.groundY - 190, 220, 190);
    ctx.fillStyle = '#6b2c1e';
    ctx.beginPath();
    ctx.moveTo(bx - 16, FIELD.groundY - 190);
    ctx.lineTo(bx + 110, FIELD.groundY - 262);
    ctx.lineTo(bx + 236, FIELD.groundY - 190);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(bx + 80, FIELD.groundY - 96, 60, 96);
    ctx.strokeStyle = '#fff6e6';
    ctx.lineWidth = 5;
    // Cross-braced barn door.
    ctx.beginPath();
    ctx.moveTo(bx + 80, FIELD.groundY - 96);
    ctx.lineTo(bx + 140, FIELD.groundY);
    ctx.moveTo(bx + 140, FIELD.groundY - 96);
    ctx.lineTo(bx + 80, FIELD.groundY);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#4a2c22';
    for (let i = 0; i < 3; i += 1) {
      const rx = bx + i * 260;
      ctx.fillRect(rx, FIELD.groundY - 150, 200, 150);
      ctx.beginPath();
      ctx.moveTo(rx - 10, FIELD.groundY - 150);
      ctx.lineTo(rx + 100, FIELD.groundY - 205);
      ctx.lineTo(rx + 210, FIELD.groundY - 150);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Near hill + ground.
  ctx.fillStyle = PALETTE.hillNear;
  ctx.beginPath();
  ctx.moveTo(0, FIELD.groundY);
  for (let x = 0; x <= FIELD.width; x += 80) {
    ctx.lineTo(x, FIELD.groundY - 34 - Math.sin((x + world.distance * 5) * 0.006) * 18);
  }
  ctx.lineTo(FIELD.width, FIELD.groundY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.groundTop;
  ctx.fillRect(0, FIELD.groundY, FIELD.width, 14);
  ctx.fillStyle = PALETTE.ground;
  ctx.fillRect(0, FIELD.groundY + 14, FIELD.width, FIELD.height - FIELD.groundY - 14);

  // Grass tufts and pebbles scrolling past.
  ctx.fillStyle = PALETTE.grass;
  for (let i = 0; i < 26; i += 1) {
    const gx = ((i * 173 - world.distance * 33) % 1400 + 1400) % 1400 - 60;
    const gy = FIELD.groundY + 24 + ((i * 53) % 80);
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + 4, gy - 12);
    ctx.lineTo(gx + 9, gy);
    ctx.closePath();
    ctx.fill();
  }
}

function drawHay(ctx, hay) {
  ctx.fillStyle = PALETTE.hay;
  ctx.beginPath();
  ctx.moveTo(hay.x, hay.y + hay.height);
  ctx.quadraticCurveTo(hay.x + hay.width / 2, hay.y - 14, hay.x + hay.width, hay.y + hay.height);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#b98f3e';
  ctx.lineWidth = 2;
  for (let i = 1; i < 5; i += 1) {
    const x = hay.x + (hay.width / 5) * i;
    ctx.beginPath();
    ctx.moveTo(x, hay.y + hay.height);
    ctx.quadraticCurveTo(x + 4, hay.y + hay.height * 0.4, x, hay.y + 8);
    ctx.stroke();
  }
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(hay.x + hay.width / 2 - 16, hay.y + hay.height - 8, 32, 8);
}

function drawOven(ctx, ob) {
  ctx.fillStyle = PALETTE.oven;
  rr(ctx, ob.x, ob.y, ob.width, ob.height, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.ovenDoor;
  rr(ctx, ob.x + 10, ob.y + 22, ob.width - 20, ob.height - 34, 6);
  ctx.fill();
  // Glowing hot interior + heat shimmer.
  ctx.fillStyle = PALETTE.ovenGlow;
  ctx.globalAlpha = 0.75 + Math.sin(ob.x * 0.05) * 0.2;
  rr(ctx, ob.x + 16, ob.y + 30, ob.width - 32, ob.height - 46, 4);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#d7dce3';
  for (let i = 0; i < 3; i += 1) {
    ctx.fillRect(ob.x + 16 + i * 24, ob.y + 6, 14, 6);
  }
  text(ctx, 'HOT!', ob.x + ob.width / 2, ob.y - 14, 16, PALETTE.danger);
}

function drawKnife(ctx, ob) {
  const cx = ob.x + ob.width / 2;
  const cy = ob.y + ob.height / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.sin(ob.swing) * 0.5);
  // Blade.
  ctx.fillStyle = PALETTE.knifeBlade;
  ctx.beginPath();
  ctx.moveTo(-ob.width / 2, -8);
  ctx.lineTo(ob.width / 2 - 18, -8);
  ctx.lineTo(ob.width / 2, 0);
  ctx.lineTo(ob.width / 2 - 18, 8);
  ctx.lineTo(-ob.width / 2, 8);
  ctx.closePath();
  ctx.fill();
  // Handle.
  ctx.fillStyle = PALETTE.knifeHandle;
  rr(ctx, -ob.width / 2 - 26, -10, 30, 20, 6);
  ctx.fill();
  ctx.restore();
  // A little stand so it reads as a trap, not a floating blade.
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(ob.x + 6, FIELD.groundY - 4, 10, 4);
  ctx.fillRect(ob.x + ob.width - 16, FIELD.groundY - 4, 10, 4);
}

function drawFence(ctx, ob) {
  ctx.fillStyle = PALETTE.fence;
  ctx.fillRect(ob.x, ob.y + 8, ob.width, 10);
  ctx.fillRect(ob.x, ob.y + 34, ob.width, 10);
  for (const px of [ob.x + 2, ob.x + ob.width / 2 - 5, ob.x + ob.width - 12]) {
    ctx.fillRect(px, ob.y, 10, ob.height);
  }
}

function drawPumpkin(ctx, ob) {
  ctx.fillStyle = PALETTE.pumpkin;
  ellipse(ctx, ob.x + ob.width / 2, ob.y + ob.height / 2 + 4, ob.width / 2, ob.height / 2);
  ctx.strokeStyle = '#b85c14';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(ob.x + ob.width / 2, ob.y + 4);
  ctx.quadraticCurveTo(ob.x + ob.width / 2 - 8, ob.y + ob.height / 2, ob.x + ob.width / 2, ob.y + ob.height);
  ctx.stroke();
  ctx.fillStyle = '#5a7a2a';
  ctx.fillRect(ob.x + ob.width / 2 - 3, ob.y - 8, 6, 12);
}

function drawCorn(ctx, item) {
  const bobY = item.y + Math.sin(item.bob) * 5;
  ctx.fillStyle = '#5a7a2a';
  ctx.beginPath();
  ctx.moveTo(item.x + 4, bobY + item.height);
  ctx.lineTo(item.x + item.width / 2, bobY + item.height + 12);
  ctx.lineTo(item.x + item.width - 4, bobY + item.height);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.corn;
  ellipse(ctx, item.x + item.width / 2, bobY + item.height / 2, item.width / 2 - 2, item.height / 2);
  ctx.strokeStyle = '#d9a92c';
  ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(item.x + item.width / 2 + i * 7, bobY + 4);
    ctx.lineTo(item.x + item.width / 2 + i * 7, bobY + item.height - 4);
    ctx.stroke();
  }
}

function drawFeather(ctx, item) {
  const bobY = item.y + Math.sin(item.bob) * 5;
  ctx.fillStyle = PALETTE.feather;
  ctx.beginPath();
  ctx.ellipse(item.x + item.width / 2, bobY + item.height / 2, 7, 13, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9a86a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(item.x + item.width / 2, bobY + 2);
  ctx.lineTo(item.x + item.width / 2 + 6, bobY + item.height - 2);
  ctx.stroke();
  ctx.fillStyle = '#e8a33c';
  ellipse(ctx, item.x + item.width / 2 + 4, bobY + item.height - 2, 3, 3);
}

/** The turkey: fanned tail, plump body, head, beak, wattle, running legs. */
function drawTurkey(ctx, world) {
  const t = world.turkey;
  const blink = t.invulnerable > 0 && Math.floor(world.time * 12) % 2 === 0;
  if (blink) ctx.globalAlpha = 0.35;
  const run = Math.sin(t.runPhase);
  const legSwing = t.grounded ? run * 10 : 6;
  const bodyY = t.y + (t.ducking ? 24 : 0);
  const bodyH = t.ducking ? t.height - 24 : t.height;

  // Tail fan.
  const tailX = t.x + 8;
  const tailY = bodyY + bodyH * 0.55;
  for (let i = 0; i < 5; i += 1) {
    const angle = -Math.PI / 2 + (i - 2) * 0.42;
    ctx.save();
    ctx.translate(tailX, tailY);
    ctx.rotate(angle);
    ctx.fillStyle = PALETTE.tail[i % PALETTE.tail.length];
    ctx.beginPath();
    ctx.ellipse(0, -30, 11, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Legs: planted on the ground while running, tucked up while airborne.
  ctx.strokeStyle = '#e8a33c';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(t.x + 34 + side * 6, bodyY + bodyH - 4);
    if (t.grounded) {
      ctx.lineTo(t.x + 34 + side * 6 + legSwing * side, FIELD.groundY);
    } else {
      ctx.lineTo(t.x + 34 + side * 6 + legSwing * 0.4, bodyY + bodyH + 12);
    }
    ctx.stroke();
  }

  // Body.
  ctx.fillStyle = PALETTE.turkeyBody;
  ellipse(ctx, t.x + 36, bodyY + bodyH * 0.55, 30, bodyH * 0.52);
  ctx.fillStyle = PALETTE.turkeyBelly;
  ellipse(ctx, t.x + 40, bodyY + bodyH * 0.62, 20, bodyH * 0.34);

  // Wing.
  ctx.fillStyle = '#6b3d20';
  ctx.beginPath();
  ctx.ellipse(t.x + 30, bodyY + bodyH * 0.55, 16, 12, -0.4 + run * 0.08, 0, Math.PI * 2);
  ctx.fill();

  if (!t.ducking) {
    // Neck + head.
    ctx.fillStyle = PALETTE.turkeyBody;
    ctx.fillRect(t.x + 52, bodyY - 8, 10, 22);
    ctx.fillStyle = PALETTE.head;
    ellipse(ctx, t.x + 58, bodyY - 12, 13, 12);
    // Beak + wattle + eye.
    ctx.fillStyle = PALETTE.beak;
    ctx.beginPath();
    ctx.moveTo(t.x + 68, bodyY - 14);
    ctx.lineTo(t.x + 82, bodyY - 9);
    ctx.lineTo(t.x + 68, bodyY - 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.wattle;
    ellipse(ctx, t.x + 62, bodyY + 2, 4, 7);
    ctx.fillStyle = '#222';
    ellipse(ctx, t.x + 61, bodyY - 15, 2.4, 2.4);
  } else {
    // Ducked: head tucked, only the beak peeks out.
    ctx.fillStyle = PALETTE.head;
    ellipse(ctx, t.x + 56, bodyY + 6, 10, 8);
    ctx.fillStyle = PALETTE.beak;
    ctx.beginPath();
    ctx.moveTo(t.x + 64, bodyY + 4);
    ctx.lineTo(t.x + 74, bodyY + 8);
    ctx.lineTo(t.x + 64, bodyY + 11);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Hidden shimmer: a "?" so the player knows the farmer lost them.
  if (t.hidden) {
    text(ctx, '?', t.x + 36, bodyY - 26, 26, '#fff6e6');
  }
}

/** The farmer: straw hat, checked shirt, overalls, pitchfork, angry stride. */
function drawFarmer(ctx, world) {
  const f = world.farmer;
  const run = Math.sin(f.runPhase);
  const x = f.x;
  const groundY = FIELD.groundY;
  const legSwing = f.searching ? 0 : run * 12;

  // Legs (overalls).
  ctx.strokeStyle = PALETTE.farmerOveralls;
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + 26 + side * 5, groundY - 52);
    ctx.lineTo(x + 26 + side * 5 + legSwing * side, groundY);
    ctx.stroke();
  }
  // Body: checked shirt.
  ctx.fillStyle = PALETTE.farmerShirt;
  rr(ctx, x + 6, groundY - 108, 42, 58, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 6, groundY - 88);
  ctx.lineTo(x + 48, groundY - 88);
  ctx.moveTo(x + 6, groundY - 70);
  ctx.lineTo(x + 48, groundY - 70);
  ctx.stroke();
  // Overalls straps.
  ctx.strokeStyle = PALETTE.farmerOveralls;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x + 14, groundY - 108);
  ctx.lineTo(x + 14, groundY - 78);
  ctx.moveTo(x + 40, groundY - 108);
  ctx.lineTo(x + 40, groundY - 78);
  ctx.stroke();
  // Arm + pitchfork.
  ctx.strokeStyle = '#e8c9a0';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(x + 44, groundY - 96);
  ctx.lineTo(x + 62, groundY - 76 + run * 3);
  ctx.stroke();
  ctx.strokeStyle = '#7a5230';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 62, groundY - 150);
  ctx.lineTo(x + 62, groundY - 60);
  ctx.stroke();
  ctx.strokeStyle = '#c9ced6';
  ctx.lineWidth = 3;
  for (const dx of [-8, 0, 8]) {
    ctx.beginPath();
    ctx.moveTo(x + 62 + dx, groundY - 150);
    ctx.lineTo(x + 62 + dx, groundY - 168);
    ctx.stroke();
  }
  // Head + straw hat + moustache.
  ctx.fillStyle = '#e8c9a0';
  ellipse(ctx, x + 27, groundY - 122, 15, 14);
  ctx.fillStyle = PALETTE.farmerHat;
  ellipse(ctx, x + 27, groundY - 132, 26, 7);
  ctx.fillRect(x + 12, groundY - 150, 30, 18);
  ctx.fillStyle = '#5a3a22';
  ctx.fillRect(x + 20, groundY - 126, 14, 4);
  ctx.fillStyle = '#222';
  ellipse(ctx, x + 33, groundY - 124, 2.2, 2.2);
  // Angry brows / searching "?" above the hat.
  if (f.searching) {
    text(ctx, '?', x + 27, groundY - 176, 28, '#fff6e6');
  }
}

function drawParticles(ctx, world) {
  for (const p of world.particles) {
    ctx.globalAlpha = Math.max(0, 1 - p.age / p.life);
    ctx.fillStyle = p.colour;
    ellipse(ctx, p.x, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

function drawHud(ctx, world, mouse) {
  const zone = zoneFor(world.distance);
  // Top bar.
  ctx.fillStyle = 'rgba(43, 26, 12, 0.55)';
  ctx.fillRect(0, 0, FIELD.width, 64);
  text(ctx, `SCORE ${Math.floor(world.score)}`, 24, 33, 26, PALETTE.text, 'left');
  text(ctx, `${Math.floor(world.distance)} m / ${ESCAPE_DISTANCE} m`, FIELD.width / 2, 33, 26, PALETTE.text);
  // Lives as hearts.
  for (let i = 0; i < 3; i += 1) {
    const hx = FIELD.width - 120 + i * 36;
    ctx.fillStyle = i < world.lives ? '#ff5a4e' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.moveTo(hx, 40);
    ctx.bezierCurveTo(hx - 12, 28, hx - 22, 40, hx, 52);
    ctx.bezierCurveTo(hx + 22, 40, hx + 12, 28, hx, 40);
    ctx.fill();
  }
  text(ctx, zone.name, FIELD.width / 2, 92, 20, PALETTE.muted);

  // Distance progress bar.
  const barW = 420;
  const barX = FIELD.width / 2 - barW / 2;
  ctx.fillStyle = 'rgba(43, 26, 12, 0.55)';
  rr(ctx, barX, 108, barW, 12, 6);
  ctx.fill();
  ctx.fillStyle = PALETTE.good;
  rr(ctx, barX, 108, barW * Math.min(1, world.distance / ESCAPE_DISTANCE), 12, 6);
  ctx.fill();
  text(ctx, 'forest ->', barX + barW + 14, 114, 15, PALETTE.text, 'left');

  // Farmer gap meter (bottom left).
  const gapW = 220;
  ctx.fillStyle = 'rgba(43, 26, 12, 0.55)';
  rr(ctx, 20, FIELD.height - 52, gapW + 130, 36, 10);
  ctx.fill();
  text(ctx, 'FARMER', 34, FIELD.height - 34, 15, PALETTE.muted, 'left');
  ctx.fillStyle = '#3a2a1a';
  rr(ctx, 110, FIELD.height - 42, gapW, 16, 8);
  ctx.fill();
  const gapFrac = world.gap / FARMER.startGap;
  ctx.fillStyle = gapFrac > 0.5 ? PALETTE.good : gapFrac > 0.25 ? '#ff9a3c' : PALETTE.danger;
  rr(ctx, 110, FIELD.height - 42, gapW * gapFrac, 16, 8);
  ctx.fill();
  text(ctx, world.turkey.hidden ? 'LOST YOU!' : gapFrac > 0.5 ? 'far behind' : gapFrac > 0.25 ? 'closing in!' : 'RIGHT BEHIND YOU!', 340, FIELD.height - 34, 15, PALETTE.text, 'left');

  // Mute + pause buttons (bottom right).
  const muteHover = mouse && mouse.x > 1180 && mouse.x < 1220 && mouse.y > FIELD.height - 52 && mouse.y < FIELD.height - 16;
  ctx.fillStyle = muteHover ? '#ff9a3c' : 'rgba(43, 26, 12, 0.55)';
  rr(ctx, 1180, FIELD.height - 52, 40, 36, 10);
  ctx.fill();
  text(ctx, world.muted ? 'OFF' : 'SND', 1200, FIELD.height - 33, 14, PALETTE.text);
  const pauseHover = mouse && mouse.x > 1230 && mouse.x < 1262 && mouse.y > FIELD.height - 52 && mouse.y < FIELD.height - 16;
  ctx.fillStyle = pauseHover ? '#ff9a3c' : 'rgba(43, 26, 12, 0.55)';
  rr(ctx, 1230, FIELD.height - 52, 32, 36, 10);
  ctx.fill();
  text(ctx, 'II', 1246, FIELD.height - 33, 16, PALETTE.text);

  // Flash message.
  if (world.messageTimer > 0 && world.message) {
    text(ctx, world.message, FIELD.width / 2, 160, 26, '#fff6e6');
  }
  // Controls hint, above the farmer meter so the two never collide.
  text(ctx, 'SPACE / CLICK jump (hold to glide) · ↓ duck & hide in hay · P pause · M mute', FIELD.width / 2, FIELD.height - 66, 15, PALETTE.muted);
}

function drawTitle(ctx, world, mouse) {
  ctx.fillStyle = 'rgba(43, 26, 12, 0.45)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  panel(ctx, 290, 90, 700, 470);
  text(ctx, 'GOBBLE DASH', 640, 225, 58, '#ffd97a');
  text(ctx, 'A turkey escape game', 640, 268, 24, PALETTE.muted);
  text(ctx, 'Thanksgiving is coming. The farmer wants you', 640, 322, 22, PALETTE.text);
  text(ctx, 'for dinner — run 1200 m to the forest and live!', 640, 350, 22, PALETTE.text);
  text(ctx, 'Jump the ovens and carving knives. Eat corn', 640, 396, 20, PALETTE.text);
  text(ctx, 'for speed, grab golden feathers for extra lives,', 640, 422, 20, PALETTE.text);
  text(ctx, 'and duck into haystacks to lose the farmer.', 640, 448, 20, PALETTE.text);
  const hover = mouse && mouse.x > 520 && mouse.x < 760 && mouse.y > 480 && mouse.y < 536;
  button(ctx, 520, 480, 240, 56, '▶  START RUN', hover);
  text(ctx, 'SPACE / CLICK to start · best score: ' + Math.floor(world.best), 640, 580, 18, PALETTE.muted);
  if (world.best > 0) text(ctx, 'Best: ' + Math.floor(world.best), 640, 600, 18, PALETTE.muted);
}

function drawEnd(ctx, world, mouse, escaped) {
  ctx.fillStyle = escaped ? 'rgba(30, 80, 30, 0.5)' : 'rgba(60, 16, 10, 0.55)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  panel(ctx, 340, 130, 600, 420);
  text(ctx, escaped ? 'YOU DID IT!' : 'OH NO!', 640, 205, 30, PALETTE.text);
  text(ctx, escaped ? 'ESCAPED!' : 'CAUGHT!', 640, 265, 54, escaped ? PALETTE.good : PALETTE.danger);
  text(ctx, escaped
    ? 'You reached the forest — no Thanksgiving dinner today!'
    : 'The farmer caught you… but every turkey gets another run.', 640, 315, 21, PALETTE.text);
  text(ctx, `Score ${Math.floor(world.score)}  ·  Distance ${Math.floor(world.distance)} m`, 640, 360, 22, PALETTE.text);
  text(ctx, `Corn eaten ${world.cornEaten}  ·  Obstacles dodged ${world.dodged}`, 640, 392, 20, PALETTE.muted);
  if (world.score > world.best) {
    text(ctx, '★ NEW BEST SCORE! ★', 640, 426, 22, '#ffd97a');
  } else {
    text(ctx, 'Best score: ' + Math.floor(world.best), 640, 426, 20, PALETTE.muted);
  }
  const hover = mouse && mouse.x > 520 && mouse.x < 760 && mouse.y > 460 && mouse.y < 516;
  button(ctx, 520, 460, 240, 56, '↻  RUN AGAIN', hover);
  text(ctx, 'Press R or SPACE, or click the button', 640, 540, 18, PALETTE.muted);
}

function drawPaused(ctx, world, mouse) {
  ctx.fillStyle = 'rgba(43, 26, 12, 0.55)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  panel(ctx, 440, 240, 400, 200);
  text(ctx, 'PAUSED', 640, 300, 44, PALETTE.text);
  text(ctx, 'P or click to keep running', 640, 350, 20, PALETTE.muted);
  const hover = mouse && mouse.x > 540 && mouse.x < 740 && mouse.y > 380 && mouse.y < 428;
  button(ctx, 540, 380, 200, 48, 'RESUME', hover);
}

export function drawWorld(ctx, world, mouse) {
  drawScenery(ctx, world);
  for (const hay of world.haystacks) if (hay.active) drawHay(ctx, hay);
  for (const item of world.pickups) {
    if (!item.active) continue;
    if (item.kind === KIND_CORN) drawCorn(ctx, item);
    else if (item.kind === KIND_FEATHER) drawFeather(ctx, item);
  }
  for (const ob of world.obstacles) {
    if (!ob.active) continue;
    if (ob.kind === KIND_OVEN) drawOven(ctx, ob);
    else if (ob.kind === KIND_KNIFE) drawKnife(ctx, ob);
    else if (ob.kind === KIND_FENCE) drawFence(ctx, ob);
    else if (ob.kind === KIND_PUMPKIN) drawPumpkin(ctx, ob);
  }
  drawFarmer(ctx, world);
  drawTurkey(ctx, world);
  drawParticles(ctx, world);
}

export function draw(ctx, world, mouse) {
  ctx.save();
  if (world.screen === SCREEN_TITLE) {
    drawWorld(ctx, world, mouse);
    drawTitle(ctx, world, mouse);
  } else if (world.screen === SCREEN_PLAY) {
    drawWorld(ctx, world, mouse);
    drawHud(ctx, world, mouse);
  } else if (world.screen === SCREEN_PAUSED) {
    drawWorld(ctx, world, mouse);
    drawHud(ctx, world, mouse);
    drawPaused(ctx, world, mouse);
  } else if (world.screen === SCREEN_CAUGHT) {
    drawWorld(ctx, world, mouse);
    drawHud(ctx, world, mouse);
    drawEnd(ctx, world, mouse, false);
  } else if (world.screen === SCREEN_ESCAPED) {
    drawWorld(ctx, world, mouse);
    drawHud(ctx, world, mouse);
    drawEnd(ctx, world, mouse, true);
  }
  ctx.restore();
}
