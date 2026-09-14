# 开源软硬件趋势雷达

[English](README.md) | [简体中文](README.zh-CN.md)

面向产品团队的每周趋势仪表板，追踪国内外值得关注的开源软件、开放硬件、创客项目与科技众筹项目。

## 在线访问

https://svenkunkka.github.io/open-source-weekly-radar/

## 关注方向

- 键盘、鼠标、控制器、HID 与人体工学输入设备
- 语音、视觉、手势、眼动、情境感知及 Agent 驱动的 AI 智能输入
- 新奇度高、具有明显技术突破的开放硬件
- GitHub、Hackaday、Hackster.io、Crowd Supply、Kickstarter、Indiegogo 等平台趋势

## 筛选模型

项目通过两条路径筛选：

- **核心相关：** 输入设备、桌面工作流、跨设备控制和 AI 辅助交互
- **前沿破格：** 技术突破和新奇度较高的硬件，即使尚未形成主流热度也会纳入

机会分计算公式：

`输入相关 × 6 + AI 输入 × 4 + 技术突破 × 4 + 市场潜力 × 3 + 新奇度 × 2 + 热度 × 1`

热度仅占总权重约 5%，避免单纯按照流量排序。

## 本地开发

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

## 项目结构

- `src/data.json`：经过核验的趋势数据与来源证据
- `src/content/dashboard/`：仪表板界面与分析内容
- `src/components/` 和 `src/charting/`：通用界面及图表组件
- `docs/components/`：组件参考文档

生成的构建产物和本地依赖未提交到仓库。
