# Open-Source Software & Hardware Trend Radar

[English](README.md) | [简体中文](README.zh-CN.md)

A weekly trend dashboard for product teams, tracking notable open-source software, open hardware, maker projects, and technology crowdfunding campaigns worldwide.

## Live dashboard

https://open-source-weekly-radar.yujianxi0.chatgpt.site

## What it tracks

- Keyboards, mice, controllers, HID devices, and ergonomic input
- AI-native input through voice, vision, gesture, eye tracking, contextual awareness, and agents
- Novel open-hardware projects with meaningful technical breakthroughs
- Trends across GitHub, Hackaday, Hackster.io, Crowd Supply, Kickstarter, Indiegogo, and other sources

## Selection model

Projects are evaluated through two channels:

- **Core relevance:** input devices, desktop workflows, cross-device control, and AI-assisted interaction
- **Frontier breakthroughs:** highly novel hardware with strong technical significance, even before mainstream traction

The opportunity score is calculated as:

`Input relevance × 6 + AI input × 4 + Technical breakthrough × 4 + Market potential × 3 + Novelty × 2 + Popularity × 1`

Popularity intentionally contributes only about 5% of the total weighting.

## Local development

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## Project structure

- `src/data.json` — reviewed trend data and source evidence
- `src/content/dashboard/` — dashboard-specific interface and analysis
- `src/components/` and `src/charting/` — shared UI and visualization components
- `docs/components/` — component reference documentation

Generated build output and local dependencies are intentionally excluded from the repository.
