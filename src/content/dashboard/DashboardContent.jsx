import React, { useMemo } from "react";
import {
  DataComponent,
  DataTable,
  EvidenceChart,
  MetricCard,
  SectionHeader,
  SortableItem,
  SortableRegion,
  useDataApp,
  useDashboardTabs,
} from "../../data-app-public.jsx";

export const dashboardTabs = [
  { id: "dashboard", label: "总览" },
  { id: "software", label: "软件" },
  { id: "hardware", label: "硬件" },
  { id: "crowdfunding", label: "众筹" },
  { id: "instructables", label: "Instructables" },
  { id: "watchlist", label: "产品机会" },
];

const compact = new Intl.NumberFormat("zh-CN", { notation: "compact", maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 0 });
const money = new Intl.NumberFormat("zh-CN", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const projectColumn = {
  field: "project",
  label: "项目",
  renderCell: (value, row) => (
    <a className="osw-project-link" href={row.url} target="_blank" rel="noreferrer">
      {value}
    </a>
  ),
};

function TableCard({ id, queryId, title, rows, columns, description, searchable = false }) {
  return (
    <DataComponent
      id={id}
      queryId={queryId}
      title={title}
      kind="table"
      variant="card"
      sourceRows={rows}
      displayRows={rows}
      description={description}
    >
      <DataTable label={title} columns={columns} rows={rows} searchable={searchable} />
    </DataComponent>
  );
}

function Canvas({ id, rows, children, className }) {
  return (
    <SortableRegion
      id={id}
      label="开源趋势仪表板模块"
      variant="canvas"
      columns={12}
      spacing="standard"
      authoredRevision={1}
      rows={rows}
      className={className}
    >
      {children}
    </SortableRegion>
  );
}

export function DashboardContent({ initialView = {} }) {
  const shell = useDataApp();
  const { queries, visible } = shell;
  const { activeTabId } = useDashboardTabs(dashboardTabs);
  const tab = initialView.tab ?? (dashboardTabs.some(item => item.id === activeTabId) ? activeTabId : "dashboard");

  const github = queries.github_weekly?.rows ?? [];
  const hackaday = queries.hackaday_weekly?.rows ?? [];
  const crowd = queries.crowdsupply_current?.rows ?? [];
  const makerPlatforms = queries.maker_platforms_current?.rows ?? [];
  const beekeeb = queries.beekeeb_current?.rows ?? [];
  const curatedHardware = queries.curated_hardware_watchlist?.rows ?? [];
  const kickstarter = queries.kickstarter_current?.rows ?? [];
  const indiegogo = queries.indiegogo_current?.rows ?? [];
  const oshw = queries.oshwhub_current?.rows ?? [];
  const instructables = queries.instructables_fusion?.rows ?? [];
  const instructablesFreshness = queries.instructables_freshness?.rows ?? [];
  const oschina = queries.oschina_releases?.rows ?? [];
  const watchlist = queries.product_watchlist?.rows ?? [];
  const coreRelevantCount = watchlist.filter(row => row.inputRelevance >= 4 || row.aiInput >= 4).length;
  const aiInputCount = watchlist.filter(row => row.aiInput >= 4).length;
  const frontierCount = watchlist.filter(row => row.breakthrough >= 4 && row.wonder >= 4).length;

  const aiCount = github.filter(row => row.category.includes("AI") || row.category === "LLM 基础设施").length;
  const aiShare = github.length ? aiCount / github.length : 0;
  const topWeeklyStars = github[0]?.weeklyStars ?? null;
  const fusionFreshness = instructablesFreshness[0] ?? {};
  const categoryRows = useMemo(() => {
    const counts = new Map();
    github.forEach(row => counts.set(row.category, (counts.get(row.category) ?? 0) + 1));
    return [...counts].map(([category, projects]) => ({ category, projects }));
  }, [github]);

  const item = (id, label, kind, span, child, minSpan) => visible(id) ? (
    <SortableItem key={id} id={id} label={label} kind={kind} span={span} minSpan={minSpan}>
      {child}
    </SortableItem>
  ) : null;

  if (tab === "software") {
    return (
      <Canvas id="open-source:software:canvas" rows={[
        { id: "software:chart", items: ["github-stars"] },
        { id: "software:tables", items: ["github-table"] },
        { id: "software:china", items: ["oschina-table"], header: <SectionHeader id="software-china-heading" title="国内发布侧信号" /> },
      ]}>
        {item("github-stars", "GitHub 周新增 Star", "chart", 12,
          <EvidenceChart id="github-stars" queryId="github_weekly" title="GitHub 周新增 Star Top 10"
            variant="card" rows={github} sourceRows={github} height={410}
            description="截至 2026-09-14 的滚动七日热门候选；官方周榜受限时使用可审计索引交叉核对。"
            spec={{ type: "horizontalBar", x: "project", y: "weeklyStars", showValues: true, sortOrder: "descending", showXAxisLabel: false, showYAxisLabel: false }} />)}
        {item("github-table", "GitHub 项目明细", "table", 12,
          <TableCard id="github-table" queryId="github_weekly" title="GitHub 项目明细" rows={github} searchable
            description="周新增 Star、当前总 Star 与项目定位；名称可直接打开仓库。"
            columns={[
              { field: "rank", label: "#" }, projectColumn,
              { field: "weeklyStars", label: "周新增 Star" },
              { field: "totalStars", label: "总 Star" },
              { field: "category", label: "类别" },
              { field: "region", label: "团队 / 社区" },
              { field: "summary", label: "主要看点" },
            ]} />)}
        {item("oschina-table", "国内开源发布", "table", 12,
          <TableCard id="oschina-table" queryId="oschina_releases" title="近七日国内开源发布" rows={oschina}
            description="OSCHINA 过去七日的新版本与项目曝光；由于没有统一互动指标，这里不与 Star 横向比较。"
            columns={[projectColumn, { field: "date", label: "发布日期" }, { field: "category", label: "类别" }, { field: "summary", label: "更新看点" }]} />)}
      </Canvas>
    );
  }

  if (tab === "hardware") {
    return (
      <Canvas id="open-source:hardware:canvas" rows={[
        { id: "hardware:weekly", items: ["hackaday-comments", "crowd-backers"], header: <SectionHeader id="hardware-weekly-heading" title="海外开放硬件信号" /> },
        { id: "hardware:details", items: ["hackaday-table", "crowd-table"] },
        { id: "hardware:maker-platforms", items: ["maker-platforms-table"], header: <SectionHeader id="hardware-maker-heading" title="创客与输入设备观察" /> },
        { id: "hardware:beekeeb", items: ["beekeeb-table"], header: <SectionHeader id="hardware-beekeeb-heading" title="开源键盘与小批量输入模块" /> },
        { id: "hardware:curated", items: ["curated-hardware-table"], header: <SectionHeader id="hardware-curated-heading" title="团队补充关注" /> },
        { id: "hardware:china", items: ["oshw-favorites"], header: <SectionHeader id="hardware-china-heading" title="国内开放硬件社区" /> },
        { id: "hardware:china-table", items: ["oshw-table"] },
      ]}>
        {item("hackaday-comments", "Hackaday 讨论热度", "chart", 7,
          <EvidenceChart id="hackaday-comments" queryId="hackaday_weekly" title="近七日新项目评论数"
            variant="card" rows={hackaday} sourceRows={hackaday} height={290}
            description="项目发布日期严格落在近七日；评论数为采集时累计值。"
            spec={{ type: "horizontalBar", x: "project", y: "comments", showValues: true, sortOrder: "descending", showXAxisLabel: false, showYAxisLabel: false }} />)}
        {item("crowd-backers", "Crowd Supply 支持者", "chart", 5,
          <EvidenceChart id="crowd-backers" queryId="crowdsupply_current" title="活跃众筹支持者"
            variant="card" rows={crowd} sourceRows={crowd} height={290}
            description="当前累计支持者快照，不是七日增量。"
            spec={{ type: "bar", x: "project", y: "backers", showValues: true, sortOrder: "descending", xTickLabelLayout: "wrap", showXAxisLabel: false, showYAxisLabel: false }} />)}
        {item("hackaday-table", "Hackaday 项目明细", "table", 7,
          <TableCard id="hackaday-table" queryId="hackaday_weekly" title="近七日硬件项目" rows={hackaday}
            columns={[projectColumn, { field: "date", label: "发布" }, { field: "comments", label: "评论" }, { field: "category", label: "方向" }, { field: "summary", label: "主要看点" }]} />)}
        {item("crowd-table", "Crowd Supply 项目明细", "table", 5,
          <TableCard id="crowd-table" queryId="crowdsupply_current" title="活跃开放硬件众筹" rows={crowd}
            columns={[
              projectColumn,
              { field: "backers", label: "支持者" },
              { field: "fundingPercent", label: "完成度", renderCell: value => value == null ? "—" : `${integer.format(value)}%` },
              { field: "raisedUsd", label: "已筹", renderCell: value => money.format(value) },
            ]} />)}
        {item("maker-platforms-table", "创客平台热点", "table", 12,
          <TableCard id="maker-platforms-table" queryId="maker_platforms_current" title="Hackster.io、Arduino 与 Tindie 当前热点" rows={makerPlatforms} searchable
            description="不同平台公开信号口径不一致，保留原始平台、阶段与热度说明，不进行跨平台数值合并。"
            columns={[
              { field: "platform", label: "平台" }, projectColumn,
              { field: "signal", label: "热度信号" },
              { field: "stage", label: "阶段" },
              { field: "category", label: "方向" },
              { field: "summary", label: "主要看点" },
            ]} />)}
        {item("beekeeb-table", "BeeKeeb Japan 新品", "table", 12,
          <TableCard id="beekeeb-table" queryId="beekeeb_current" title="BeeKeeb Japan 当前新品候选" rows={beekeeb} searchable
            description="商城没有公开销量或七日增量，因此按新品区曝光展示，并保留价格、阶段与规格风险。"
            columns={[
              projectColumn,
              { field: "signal", label: "当前信号" },
              { field: "stage", label: "阶段" },
              { field: "category", label: "方向" },
              { field: "summary", label: "产品看点" },
              { field: "risk", label: "核验风险" },
            ]} />)}
        {item("curated-hardware-table", "团队补充关注", "table", 12,
          <TableCard id="curated-hardware-table" queryId="curated_hardware_watchlist" title="团队补充关注的开源硬件" rows={curatedHardware} searchable
            description="用户指定项目单独展示，不混入 GitHub Trending 官方周榜；累计指标保留原核验日期。"
            columns={[
              projectColumn,
              { field: "signal", label: "社区信号" },
              { field: "license", label: "许可证" },
              { field: "lastPush", label: "最近推送" },
              { field: "stage", label: "阶段" },
              { field: "category", label: "方向" },
              { field: "summary", label: "主要看点" },
              { field: "risk", label: "主要风险" },
            ]} />)}
        {item("oshw-favorites", "立创开源广场收藏", "chart", 12,
          <EvidenceChart id="oshw-favorites" queryId="oshwhub_current" title="当前综合榜项目收藏数"
            variant="card" rows={[...oshw].sort((a, b) => b.favorites - a.favorites)} sourceRows={oshw} height={360}
            description="立创开源广场当前累计收藏，用于观察国内硬件社区关注方向，不代表七日增量。"
            spec={{ type: "horizontalBar", x: "project", y: "favorites", showValues: true, sortOrder: "descending", showXAxisLabel: false, showYAxisLabel: false }} />)}
        {item("oshw-table", "立创开源广场项目", "table", 12,
          <TableCard id="oshw-table" queryId="oshwhub_current" title="国内开放硬件项目明细" rows={oshw} searchable
            columns={[projectColumn, { field: "category", label: "方向" }, { field: "views", label: "浏览" }, { field: "likes", label: "点赞" }, { field: "favorites", label: "收藏" }, { field: "comments", label: "评论" }]} />)}
      </Canvas>
    );
  }

  if (tab === "crowdfunding") {
    return (
      <Canvas id="open-source:crowdfunding:canvas" rows={[
        { id: "crowdfunding:metrics", kind: "metrics", items: ["kpi-kickstarter", "kpi-indiegogo"] },
        { id: "crowdfunding:charts", items: ["kickstarter-backers", "indiegogo-backers"], header: <SectionHeader id="crowdfunding-chart-heading" title="当前热门候选" /> },
        { id: "crowdfunding:tables", items: ["kickstarter-table", "indiegogo-table"] },
      ]}>
        {item("kpi-kickstarter", "Kickstarter 热门候选", "metric", 6,
          <MetricCard id="kpi-kickstarter" queryId="kickstarter_current" title="Kickstarter 热门候选"
            value={integer.format(kickstarter.length)} sourceRows={kickstarter} displayRows={kickstarter}
            description="当前可验证的科技与硬件项目；并非官方精确实时排名。" />, 3)}
        {item("kpi-indiegogo", "Indiegogo 热门候选", "metric", 6,
          <MetricCard id="kpi-indiegogo" queryId="indiegogo_current" title="Indiegogo 热门候选"
            value={integer.format(indiegogo.length)} sourceRows={indiegogo} displayRows={indiegogo}
            description="包含募资中、Pledge Manager 与近期仍活跃的科技硬件项目。" />, 3)}
        {item("kickstarter-backers", "Kickstarter 支持者", "chart", 6,
          <EvidenceChart id="kickstarter-backers" queryId="kickstarter_current" title="Kickstarter 候选项目累计支持者"
            variant="card" rows={kickstarter} sourceRows={kickstarter} height={330}
            description="采集时累计支持者，不是过去七日新增；筹资额与支持者可能来自不同更新时间的快照。"
            spec={{ type: "horizontalBar", x: "project", y: "backers", showValues: true, sortOrder: "descending", showXAxisLabel: false, showYAxisLabel: false }} />)}
        {item("indiegogo-backers", "Indiegogo 支持者", "chart", 6,
          <EvidenceChart id="indiegogo-backers" queryId="indiegogo_current" title="Indiegogo 候选项目支持者信号"
            variant="card" rows={indiegogo} sourceRows={indiegogo} height={330}
            description="部分数字是搜索索引可验证的下限；项目阶段不同，不与 Kickstarter 数值合并。"
            spec={{ type: "horizontalBar", x: "project", y: "backers", showValues: true, sortOrder: "descending", showXAxisLabel: false, showYAxisLabel: false }} />)}
        {item("kickstarter-table", "Kickstarter 项目明细", "table", 6,
          <TableCard id="kickstarter-table" queryId="kickstarter_current" title="Kickstarter 科技与硬件候选" rows={kickstarter}
            description="当天项目快照；点击名称打开官方项目页。"
            columns={[
              { field: "rank", label: "#" }, projectColumn,
              { field: "backers", label: "支持者", renderCell: value => integer.format(value) },
              { field: "raisedDisplay", label: "筹资信号" },
              { field: "status", label: "阶段" },
              { field: "category", label: "方向" },
              { field: "summary", label: "主要看点" },
            ]} />)}
        {item("indiegogo-table", "Indiegogo 项目明细", "table", 6,
          <TableCard id="indiegogo-table" queryId="indiegogo_current" title="Indiegogo 科技与硬件候选" rows={indiegogo}
            description="当天项目与搜索索引快照；≥ 表示可验证下限。"
            columns={[
              { field: "rank", label: "#" }, projectColumn,
              { field: "backersDisplay", label: "支持者" },
              { field: "raisedDisplay", label: "筹资信号" },
              { field: "status", label: "阶段" },
              { field: "category", label: "方向" },
              { field: "summary", label: "主要看点" },
            ]} />)}
      </Canvas>
    );
  }

  if (tab === "instructables") {
    return (
      <Canvas id="open-source:instructables:canvas" rows={[
        { id: "instructables:metrics", kind: "metrics", items: ["kpi-instructables-weekly", "kpi-instructables-count", "kpi-instructables-latest"] },
        { id: "instructables:chart", items: ["instructables-favorites"] },
        { id: "instructables:table", items: ["instructables-table"] },
      ]}>
        {item("kpi-instructables-weekly", "近七日新增项目", "metric", 4,
          <MetricCard id="kpi-instructables-weekly" queryId="instructables_freshness" title="近七日新增项目"
            value={integer.format(fusionFreshness.weeklyNew ?? 0)} sourceRows={instructablesFreshness} displayRows={instructablesFreshness}
            description="Teachers + Fusion 筛选；复查窗口为 2026-09-07 至 2026-09-14。" />, 2)}
        {item("kpi-instructables-count", "Fusion 项目总量", "metric", 4,
          <MetricCard id="kpi-instructables-count" queryId="instructables_freshness" title="Fusion 项目总量"
            value={integer.format(fusionFreshness.visibleProjects ?? 0)} sourceRows={instructablesFreshness} displayRows={instructablesFreshness}
            description="教师项目页勾选 Fusion 后可见的项目总数。" />, 2)}
        {item("kpi-instructables-latest", "最近发布", "metric", 4,
          <MetricCard id="kpi-instructables-latest" queryId="instructables_freshness" title="最近发布"
            value={fusionFreshness.latestPublished ?? "—"} sourceRows={instructablesFreshness} displayRows={instructablesFreshness}
            description={fusionFreshness.latestProject ?? "最近项目"} />, 2)}
        {item("instructables-favorites", "Instructables Fusion 收藏榜", "chart", 12,
          <EvidenceChart id="instructables-favorites" queryId="instructables_fusion" title="Teachers + Fusion 累计收藏 Top 10"
            variant="card" rows={instructables} sourceRows={instructables} height={420}
            description="该页面不存在官方周热榜；以下是累计收藏榜，单独展示、不与周增量混用。"
            spec={{ type: "horizontalBar", x: "project", y: "favorites", showValues: true, sortOrder: "descending", showXAxisLabel: false, showYAxisLabel: false }} />)}
        {item("instructables-table", "Instructables 项目明细", "table", 12,
          <TableCard id="instructables-table" queryId="instructables_fusion" title="Fusion 教学项目明细" rows={instructables} searchable
            columns={[projectColumn, { field: "category", label: "方向" }, { field: "favorites", label: "收藏" }, { field: "views", label: "浏览" }, { field: "madeIts", label: "复现数", renderCell: value => value == null ? "—" : integer.format(value) }]} />)}
      </Canvas>
    );
  }

  if (tab === "watchlist") {
    return (
      <Canvas id="open-source:watchlist:canvas" rows={[
        { id: "watchlist:metrics", kind: "metrics", items: ["kpi-core-relevant", "kpi-ai-input", "kpi-frontier"] },
        { id: "watchlist:score", items: ["watchlist-score"] },
        { id: "watchlist:intro", items: ["watchlist-summary"] },
        { id: "watchlist:table", items: ["watchlist-table"] },
      ]}>
        {item("kpi-core-relevant", "输入设备高相关", "metric", 4,
          <MetricCard id="kpi-core-relevant" queryId="product_watchlist" title="输入设备高相关"
            value={integer.format(coreRelevantCount)} sourceRows={watchlist} displayRows={watchlist.filter(row => row.inputRelevance >= 4 || row.aiInput >= 4)}
            description="输入相关或 AI 输入评分达到 4/5 的项目。" />, 2)}
        {item("kpi-ai-input", "AI 智能输入", "metric", 4,
          <MetricCard id="kpi-ai-input" queryId="product_watchlist" title="AI 智能输入"
            value={integer.format(aiInputCount)} sourceRows={watchlist} displayRows={watchlist.filter(row => row.aiInput >= 4)}
            description="语音、视觉、手势、眼动、情境感知或 Agent 驱动的新输入方式。" />, 2)}
        {item("kpi-frontier", "前沿突破硬件", "metric", 4,
          <MetricCard id="kpi-frontier" queryId="product_watchlist" title="前沿突破硬件"
            value={integer.format(frontierCount)} sourceRows={watchlist} displayRows={watchlist.filter(row => row.breakthrough >= 4 && row.wonder >= 4)}
            description="技术突破与新奇度均达到 4/5；即使当前热度不高也可入选。" />, 2)}
        {item("watchlist-score", "产品机会综合评分", "chart", 12,
          <EvidenceChart id="watchlist-score" queryId="product_watchlist" title="产品机会综合评分"
            variant="card" rows={watchlist} sourceRows={watchlist} height={430}
            description="热度仅占 5%；主要权重给输入相关、AI 输入、技术突破、市场潜力与新奇度。"
            spec={{ type: "horizontalBar", x: "project", y: "score", showValues: true, sortOrder: "descending", showXAxisLabel: false, showYAxisLabel: false }} />)}
        {item("watchlist-summary", "产品启发摘要", "custom", 12,
          <DataComponent id="watchlist-summary" queryId="product_watchlist" title="双通道入选规则"
            kind="custom" variant="card" sourceRows={watchlist} displayRows={watchlist}
            description="既抓高相关产品，也允许低热度或低相关但技术突破明显的硬件进入雷达。">
            <div className="osw-watch-summary" data-reviewed-rows>
              <div><strong>核心相关</strong><span>输入相关或 AI 输入达到 4/5：键鼠、控制器、HID、人体工学、跨设备输入和桌面 Agent 优先。</span></div>
              <div><strong>前沿破格</strong><span>技术突破与新奇度同时达到 4/5：即使支持者少、尚未开募或与键鼠不直接相关，也进入观察池。</span></div>
              <div><strong>风险护栏</strong><span>热度只占综合分 5%；同时标记预发布、Pledge Manager、规格变化与众筹履约风险。</span></div>
            </div>
          </DataComponent>)}
        {item("watchlist-table", "产品启发清单", "table", 12,
          <TableCard id="watchlist-table" queryId="product_watchlist" title="产品机会与前沿硬件清单" rows={watchlist} searchable
            columns={[
              { field: "priority", label: "优先级" }, projectColumn,
              { field: "track", label: "机会方向" },
              { field: "selectionPath", label: "入选路径" },
              { field: "signal", label: "热度信号" },
              { field: "stage", label: "项目阶段" },
              { field: "risk", label: "主要风险" },
              { field: "inputRelevance", label: "输入相关", renderCell: value => <span className="osw-relevance">{value}/5</span> },
              { field: "aiInput", label: "AI 输入", renderCell: value => <span className="osw-relevance">{value}/5</span> },
              { field: "breakthrough", label: "技术突破", renderCell: value => <span className="osw-relevance">{value}/5</span> },
              { field: "potential", label: "市场潜力", renderCell: value => <span className="osw-relevance">{value}/5</span> },
              { field: "wonder", label: "新奇度", renderCell: value => <span className="osw-relevance">{value}/5</span> },
              { field: "score", label: "机会分" },
              { field: "takeaway", label: "建议关注" },
            ]} />)}
      </Canvas>
    );
  }

  return (
    <Canvas id="open-source:overview:canvas" className="osw-overview" rows={[
      { id: "overview:metrics", kind: "metrics", spacing: "none", items: ["kpi-top-stars", "kpi-ai-share", "kpi-hardware-posts", "kpi-instructables-weekly"] },
      { id: "overview:signals", spacing: "after-metrics", items: ["github-stars", "category-mix"] },
      { id: "overview:summary", items: ["signal-summary"] },
    ]}>
      {item("kpi-top-stars", "最高周新增 Star", "metric", 3,
        <MetricCard id="kpi-top-stars" queryId="github_weekly" title="最高周新增 Star" value={compact.format(topWeeklyStars ?? 0)}
          sourceRows={github} displayRows={github.slice(0, 1)} description={`${github[0]?.project ?? "—"}，当前滚动七日热门候选。`} />, 2)}
      {item("kpi-ai-share", "AI 相关项目占比", "metric", 3,
        <MetricCard id="kpi-ai-share" queryId="github_weekly" title="AI 相关项目占比" value={`${Math.round(aiShare * 100)}%`}
          sourceRows={github} displayRows={categoryRows} description={`${aiCount} / ${github.length} 个当前候选项目按公开定位归为 AI 相关。`} />, 2)}
      {item("kpi-hardware-posts", "七日硬件项目", "metric", 3,
        <MetricCard id="kpi-hardware-posts" queryId="hackaday_weekly" title="七日硬件项目" value={integer.format(hackaday.length)}
          sourceRows={hackaday} displayRows={hackaday} description="本仪表板收录的 Hackaday 近七日开放硬件项目。" />, 2)}
      {item("kpi-instructables-weekly", "Instructables 七日新增", "metric", 3,
        <MetricCard id="kpi-instructables-weekly" queryId="instructables_freshness" title="Instructables 七日新增" value={integer.format(fusionFreshness.weeklyNew ?? 0)}
          sourceRows={instructablesFreshness} displayRows={instructablesFreshness} description="Teachers + Fusion 筛选；最近发布仍停留在 2026-04-27。" />, 2)}
      {item("github-stars", "GitHub 周新增 Star", "chart", 8,
        <EvidenceChart id="github-stars" queryId="github_weekly" title="GitHub 周新增 Star Top 10"
          variant="card" rows={github} sourceRows={github} height={410}
          description="本周 GitHub 热门候选的近似动量信号；其他平台因口径不同不叠加到同一坐标轴。"
          spec={{ type: "horizontalBar", x: "project", y: "weeklyStars", showValues: true, sortOrder: "descending", showXAxisLabel: false, showYAxisLabel: false }} />)}
      {item("category-mix", "GitHub 类别构成", "chart", 4,
        <EvidenceChart id="category-mix" queryId="github_weekly" title="Top 10 项目类别构成"
          variant="card" rows={categoryRows} sourceRows={github} height={410}
          description="按项目公开描述人工归类；用于观察主题集中度。"
          spec={{ type: "pie", x: "category", y: "projects", showValues: true, showXAxisLabel: false, showYAxisLabel: false }} />)}
      {item("signal-summary", "本周信号", "custom", 12,
        <DataComponent id="signal-summary" queryId="github_weekly"
          queryIds={["github_weekly", "hackaday_weekly", "instructables_freshness"]}
          title="本周值得团队讨论的三个信号" kind="custom" variant="card"
          sourceRows={github}
          sourceRowsByQuery={{ github_weekly: github, hackaday_weekly: hackaday, instructables_freshness: instructablesFreshness }}
          displayRows={[]}
          description="来自 GitHub、Hackaday 和 Instructables 的独立指标，不进行跨平台数值相加。">
          <div className="osw-signal-grid">
            <article><span>01</span><strong>AI 热点继续向执行工具链集中</strong><p>VoiceStudio、ARTEMIS、open-code-review 与 Agent-Reach 把语音、移动自动化和代码工作流连到 Agent。</p></article>
            <article><span>02</span><strong>输入设备开始“结构与模块即产品”</strong><p>X-Hinges、TypAir、KeyMod 与 BeeKeeb 的轨迹球、触控板和 MIP 屏，把输入延展到可感知结构、可穿戴和模块化组合。</p></article>
            <article><span>03</span><strong>Instructables 适合灵感库，不适合周榜</strong><p>Fusion 教师页近七日没有新项目，但累计收藏榜仍能反映可复现结构方案。</p></article>
          </div>
        </DataComponent>)}
    </Canvas>
  );
}
