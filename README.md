[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![main](https://make.fun/badge/turkey-run-game-01/huahhhas/turkey-run-game-20261127/main.svg)](https://make.fun/bounty/turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/huahhhas/turkey-run-game-20261127/rank.svg)](https://make.fun/bounty/turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/huahhhas/turkey-run-game-20261127/reward.svg)](https://make.fun/bounty/turkey-run-game-01)

# Gobble Dash — a turkey escape game

Thanksgiving is coming, and the farmer wants you for dinner. Run 1,200 metres
from the farmyard, through the cornfield and past the kitchen, to the forest —
and live to gobble another day.

## Play

Open `game/index.html` in a desktop browser (or serve `game/` with any static
server). No network, no build step, no files outside `game/`.

- **SPACE / ↑ / W / click** — jump
- **↓ / S** — duck; duck inside a haystack to hide from the farmer
- **P / Esc** — pause · **M** — mute · **R** — run again

## The run

- **The farmer chases you.** Every stumble into an oven, a carving knife, a
  fence or a pumpkin lets him close in; clean running and corn push him back.
  If he reaches you, you're caught.
- **Three zones, rising danger.** The Farmyard (fences, pumpkins), the
  Cornfield (faster, more knives), and The Kitchen (ovens everywhere).
- **Eat corn** for points and breathing room, grab a **golden feather** for an
  extra life, and **hide in haystacks** to shake the farmer off your trail.
- **Escape** by covering 1,200 m — or get caught and try again. Three lives,
  a best score saved in your browser.

## What's inside

- `game/index.html` — the game page (canvas, no external requests)
- `game/src/tuning.js` — every number and colour
- `game/src/rng.js` — seeded randomness (same seed, same screenshot)
- `game/src/input.js` — keyboard + mouse
- `game/src/audio.js` — synthesised Web Audio sounds, no sound files
- `game/src/entities.js` — obstacles, pickups, haystacks, particles
- `game/src/world.js` — states, the chase, zones, scoring
- `game/src/draw.js` — all art, drawn in code
- `game/src/shots.js` — deterministic screenshot scenes (`?shot=…&seed=…`)
- `game/src/main.js` — boot and the fixed-step loop
- `main.ts` — the hand-in program: copies `game/` + `screenshots/` to
  `/output` and writes `/output/dossier.json`
- `vendor/makefun-game.ts` — the make.fun dossier library, unchanged

All art and sound are original and drawn/generated in code. Built for the
[turkey-run-game-01](https://make.fun/bounty/turkey-run-game-01) bounty on
make.fun.

## License

MIT — see `LICENSE`.
