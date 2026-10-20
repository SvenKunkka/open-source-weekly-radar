<!-- SVENKUNKKA-README-NAV:BEGIN -->
[中文项目说明](#project-overview-zh) · [English overview](#project-overview-en) · [维护者 X / Maintainer on X](https://x.com/Svenu1s5)
<!-- SVENKUNKKA-README-NAV:END -->

# Open-Source Software & Hardware Trend Radar

[English](README.md) | [简体中文](README.zh-CN.md)

A weekly trend dashboard for product teams, tracking notable open-source software, open hardware, maker projects, and technology crowdfunding campaigns worldwide.

## Live dashboard

https://svenkunkka.github.io/open-source-weekly-radar/

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


---

<!-- SVENKUNKKA-PROJECT-INFO:BEGIN -->

<a id="project-overview-zh"></a>
## 中文项目说明

面向产品团队的开源软硬件趋势仪表板，聚焦输入设备、AI 交互、创客与科技众筹项目，结合相关性、技术突破、新奇度等维度筛选，并保留来源证据。

**使用入口：** 访问 [在线仪表板](https://svenkunkka.github.io/open-source-weekly-radar/)；本地运行 `npm install`、`npm run dev`，构建使用 `npm run build`，趋势资料位于 `src/data.json`。

**范围说明：** 页面内容以仓库已收录的数据与对应来源为准；评分是项目筛选模型，不是对市场表现的保证。

<a id="project-overview-en"></a>
## English project overview

A trend dashboard for product teams covering open-source software and hardware, input devices, AI interaction, maker projects, and technology crowdfunding, with relevance, breakthrough, and novelty-based selection and source evidence.

**Getting started:** Visit the [dashboard](https://svenkunkka.github.io/open-source-weekly-radar/). Locally, run `npm install` and `npm run dev`; build with `npm run build`. Trend material is stored in `src/data.json`.

**Scope:** Content reflects the repository’s collected data and cited sources. Scores are a selection model, not a guarantee of market performance.

**仓库维护者 / Repository maintainer:** [SvenKunkka](https://github.com/SvenKunkka) · [X / Twitter](https://x.com/Svenu1s5)

<!-- SVENKUNKKA-PROJECT-INFO:END -->
