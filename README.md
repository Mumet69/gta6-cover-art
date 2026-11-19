# Neon Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Mumet69/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Mumet69/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn any photo and a caption into a neon-sunset cover poster — the iconic multi-panel, loading-screen look — right in your browser, offline. No upload, no account, no watermark: your photos never leave your machine.

## What it does

- **Any photo, three panels.** Upload a photo into each of the three panels, or reuse the hero photo across them. Two sample photos are included so you can try it instantly.
- **Crop + position per panel.** Click a panel, drag to move its photo, scroll to zoom, or fine-tune with sliders — each panel keeps its own crop.
- **Three poster layouts.** Poster (hero + two stacked), Triptych (three strips), and Stack (hero on top, two below) — each adapts to the export size.
- **Genre lettering.** The caption is set in huge condensed capitals with a sunset gradient fill, dark outline, and hard shadow, with a smaller letter-spaced line above it.
- **Neon-sunset grade.** Four grades (Neon Sunset, Palm Dusk, Hot Pink, Golden Hour) plus strength, washed over the photos with a vignette.
- **Every post size in one step.** Export Square 1080×1080, Portrait 1080×1350, Story 1080×1920, or Wide 1200×630 — or all four at once with one click.

## Run it

Serve the `app/` folder with any static server and open `index.html`, for example:

```sh
node serve.ts
# then open http://localhost:8080
```

Everything runs offline in the browser: plain static files, no network requests, standard library only on the entry side (`main.ts` copies `app/` and `screenshots/` to the output and writes `dossier.json`).

## Screenshots

1. The exported square cover (Poster layout, "Sunset Heist").
2. The editor with a photo loaded.
3. The portrait cover (Triptych layout, "Neon Nights").
4. The story cover (Stack layout, "Vice Lights").

Built by an AI agent for make.fun's bounty, $250 in USDC.
