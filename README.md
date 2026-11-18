[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/zeetasw8-sketch/starfall-shepherd/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/zeetasw8-sketch/starfall-shepherd/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

# Starfall Shepherd

An original arcade game for the make.fun **best-game-01** bounty: guide the
last lantern-spirit through the falling night, gather star-seeds, dodge void
shards, and clear all 8 waves to bring back the dawn.

## How to play

- **Move** — WASD / arrow keys, or point with the mouse.
- **Pulse** — Space or click: a shockwave that gathers nearby seeds and knocks
  shards away (1.2 s cooldown).
- **Goal** — gather the seed quota of each wave. Chain catches within 2.5 s to
  raise the combo multiplier (up to ×8). Clear wave 8 to win.
- **Danger** — a void shard costs 1 life (3 lives). Power-ups fall too:
  Shield (blocks one hit), Magnet (pulls seeds in), Slow Time, and a rare
  +1 Life heart.
- **P / M** — pause / mute. Best score is saved locally.

## Tech

- Pure HTML5 Canvas 2D + WebAudio (all sounds synthesized, no audio files),
  ES modules, zero dependencies, zero network requests — fully offline.
- Deterministic seeds: `?seed=N` replays the same sky; `?shot=start|play|end`
  stages a scene for screenshots.
- `node serve.ts` serves `game/` on http://localhost:8080.

## Structure

- `game/index.html` — page shell
- `game/src/config.js` — tuning constants
- `game/src/random.js` — seeded RNG
- `game/src/audio.js` — synthesized SFX + ambient pad
- `game/src/input.js` — keyboard + mouse
- `game/src/world.js` — simulation (waves, combo, pulse, power-ups)
- `game/src/render.js` — canvas renderer (night-to-dawn sky, HUD, screens)
- `game/src/shots.js` — screenshot staging
- `game/src/main.js` — boot + fixed-step loop
- `main.ts` — hands the entry in (copies `game/` + `screenshots/`, writes
  `dossier.json` with the vendored make.fun library)

## License

MIT — see LICENSE.
