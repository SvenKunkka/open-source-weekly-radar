import React, { createContext, useContext, useMemo, useState } from "react";
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
import translations from "./translations.json";

const RadarLanguage = createContext(null);
function useRadarLanguage() { return useContext(RadarLanguage); }


export const dashboardTabs = [
  { id: "dashboard", label: "总览 Overview" },
  { id: "software", label: "软件 Software" },
  { id: "hardware", label: "硬件 Hardware" },
  { id: "crowdfunding", label: "众筹 Crowdfunding" },
  { id: "instructables", label: "Instructables" },
  { id: "watchlist", label: "产品机会 Opportunities" },
];

const compact = new Intl.NumberFormat("zh-CN", { notation: "compact", maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 0 });
const money = new Intl.NumberFormat("zh-CN", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function makeProjectColumn(t) { return {
  field: "project",
  label: t("Project"),
  renderCell: (value, row) => (
    <a className="osw-project-link" href={row.url} target="_blank" rel="noreferrer">
      {value}
    </a>
  ),
}; }

function TableCard({ id, queryId, title, rows, columns, description, searchable = false }) {
  const { language } = useRadarLanguage();
  const displayRows = useMemo(() => language === "zh" ? rows.map(row => ({ ...row, ...row.zh })) : rows, [rows, language]);
  return (
    <DataComponent
      id={id}
      queryId={queryId}
      title={title}
      kind="table"
      variant="card"
      sourceRows={rows}
      displayRows={displayRows}
      description={description}
    >
      <DataTable label={title} columns={columns} rows={displayRows} searchable={searchable} />
    </DataComponent>
  );
}

function Canvas({ id, rows, children, className }) {
  const { t, language, setLanguage } = useRadarLanguage();
  return (
    <>
    <div className="osw-language-control">
      <label htmlFor="radar-language">语言 / Language</label>
      <select id="radar-language" value={language} onChange={event => setLanguage(event.target.value)}>
        <option value="zh">简体中文</option><option value="en">English</option>
      </select>
    </div>
    <SortableRegion
      id={id}
      label={t("Open-source radar modules")}
      variant="canvas"
      columns={12}
      spacing="standard"
      authoredRevision={1}
      rows={rows}
      className={className}
    >
      {children}
    </SortableRegion>
    </>
  );
}

export function DashboardContent(props) {
  const [language, setLanguage] = useState("zh");
  const context = useMemo(() => ({ language, setLanguage, t: text => language === "zh" ? (translations[text] ?? text) : text }), [language]);
  return <RadarLanguage.Provider value={context}><RadarContent {...props} /></RadarLanguage.Provider>;
}

function RadarContent({ initialView = {} }) {
  const { t, language } = useRadarLanguage();
  const projectColumn = makeProjectColumn(t);
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
  const frontierCount = watchlist.filter(row => row.isHardware === true && row.breakthrough >= 4 && row.wonder >= 4).length;

  const aiCount = github.filter(row => row.category.includes("AI") || row.category === "LLM infrastructure").length;
  const aiShare = github.length ? aiCount / github.length : 0;
  const topWeeklyStars = github[0]?.weeklyStars ?? null;
  const fusionFreshness = instructablesFreshness[0] ?? {};
  const categoryRows = useMemo(() => {
    const counts = new Map();
    github.forEach(row => counts.set(row.category, (counts.get(row.category) ?? 0) + 1));
    return [...counts].map(([category, projects]) => ({ category: language === "zh" ? (github.find(row => row.category === category)?.zh?.category ?? category) : category, projects }));
  }, [github, language]);

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
        { id: "software:china", items: ["oschina-table"], header: <SectionHeader id="software-china-heading" title={t("China release signals")} /> },
      ]}>
        {item("github-stars", t("New-repository stars"), "chart", 12,
          <EvidenceChart id="github-stars" queryId="github_weekly" title={t("New-repository candidates: stars")}
            variant="card" rows={github} sourceRows={github} height={410}
            description={t("Oct 12–19 new-repository candidates. Official metadata snapshots; Trending was unavailable. One out-of-scope adult-image repository excluded.")}
            spec={{ type: "horizontalBar", x: "project", y: "weeklyStars", showValues: true, sortOrder: "descending", showXAxisLabel: false, showYAxisLabel: false }} />)}
        {item("github-table", t("GitHub candidates"), "table", 12,
          <TableCard id="github-table" queryId="github_weekly" title={t("GitHub candidates")} rows={github} searchable
            description={t("Current stars on repositories created within the window; names open official repositories.")}
            columns={[
              { field: "rank", label: "#" }, projectColumn,
              { field: "weeklyStars", label: t("New-repo stars") },
              { field: "totalStars", label: t("Total stars") },
              { field: "category", label: t("Category") },
              { field: "region", label: t("Community") },
              { field: "summary", label: t("Highlights") },
            ]} />)}
        {item("oschina-table", t("China release signals"), "table", 12,
          <TableCard id="oschina-table" queryId="oschina_releases" title={t("Recent OSCHINA releases")} rows={oschina}
            description={t("Dated releases from Oct 12–19; editorial exposure, not a popularity rank.")}
            columns={[projectColumn, { field: "date", label: t("Published") }, { field: "category", label: t("Category") }, { field: "summary", label: t("Release notes") }]} />)}
      </Canvas>
    );
  }

  if (tab === "hardware") {
    return (
      <Canvas id="open-source:hardware:canvas" rows={[
        { id: "hardware:weekly", items: ["hackaday-comments", "crowd-backers"], header: <SectionHeader id="hardware-weekly-heading" title={t("Open hardware signals")} /> },
        { id: "hardware:details", items: ["hackaday-table", "crowd-table"] },
        { id: "hardware:maker-platforms", items: ["maker-platforms-table"], header: <SectionHeader id="hardware-maker-heading" title={t("Maker and input-device signals")} /> },
        { id: "hardware:beekeeb", items: ["beekeeb-table"], header: <SectionHeader id="hardware-beekeeb-heading" title={t("Keyboard and input modules")} /> },
        { id: "hardware:curated", items: ["curated-hardware-table"], header: <SectionHeader id="hardware-curated-heading" title={t("Team watchlist")} /> },
        { id: "hardware:china", items: ["oshw-favorites"], header: <SectionHeader id="hardware-china-heading" title={t("China hardware community")} /> },
        { id: "hardware:china-table", items: ["oshw-table"] },
      ]}>
        {item("hackaday-comments", t("Hackaday discussion"), "chart", 7,
          <EvidenceChart id="hackaday-comments" queryId="hackaday_weekly" title={t("Recent articles: cumulative comments")}
            variant="card" rows={hackaday} sourceRows={hackaday} height={290}
            description={t("Articles published in the review window; comments are cumulative snapshots.")}
            spec={{ type: "horizontalBar", x: "project", y: "comments", showValues: true, sortOrder: "descending", showXAxisLabel: false, showYAxisLabel: false }} />)}
        {item("crowd-backers", t("Crowd Supply backers"), "chart", 5,
          <EvidenceChart id="crowd-backers" queryId="crowdsupply_current" title={t("Campaigns: cumulative backers")}
            variant="card" rows={crowd} sourceRows={crowd} height={290}
            description={t("Cumulative supporters. Table shows differences from the Oct 12 snapshot, not exact 168-hour growth.")}
            spec={{ type: "bar", x: "project", y: "backers", showValues: true, sortOrder: "descending", xTickLabelLayout: "wrap", showXAxisLabel: false, showYAxisLabel: false }} />)}
        {item("hackaday-table", t("Hackaday stories"), "table", 7,
          <TableCard id="hackaday-table" queryId="hackaday_weekly" title={t("Recent hardware stories")} rows={hackaday}
            columns={[projectColumn, { field: "date", label: t("Published") }, { field: "comments", label: t("Comments") }, { field: "category", label: t("Focus") }, { field: "summary", label: t("Highlights") }]} />)}
        {item("crowd-table", t("Crowd Supply projects"), "table", 5,
          <TableCard id="crowd-table" queryId="crowdsupply_current" title={t("Campaign and pre-order snapshots")} rows={crowd}
            columns={[
              projectColumn,
              { field: "backers", label: t("Backers") },
              { field: "fundingPercent", label: t("Funded"), renderCell: value => value == null ? "—" : `${integer.format(value)}%` },
              { field: "raisedUsd", label: t("Raised"), renderCell: value => money.format(value) },
              { field: "change", label: t("Change vs Oct 12") },
              { field: "stage", label: t("Stage") },
            ]} />)}
        {item("maker-platforms-table", t("Maker candidates"), "table", 12,
          <TableCard id="maker-platforms-table" queryId="maker_platforms_current" title={t("Hackster, Arduino and Tindie candidates")} rows={makerPlatforms} searchable
            description={t("Publication dates, cumulative views and maker availability claims are separate signals.")}
            columns={[
              { field: "platform", label: t("Platform") }, projectColumn,
              { field: "signal", label: t("Evidence / heat") },
              { field: "stage", label: t("Stage") },
              { field: "category", label: t("Focus") },
              { field: "summary", label: t("Highlights") },
            ]} />)}
        {item("beekeeb-table", t("BeeKeeb candidates"), "table", 12,
          <TableCard id="beekeeb-table" queryId="beekeeb_current" title={t("BeeKeeb: current product candidates")} rows={beekeeb} searchable
            description={t("No public weekly sales. Homepage exposure and product-page prices are candidates, not sales ranks.")}
            columns={[
              projectColumn,
              { field: "signal", label: t("Current signal") },
              { field: "stage", label: t("Stage") },
              { field: "category", label: t("Focus") },
              { field: "summary", label: t("Product notes") },
              { field: "risk", label: t("Verification risks") },
            ]} />)}
        {item("curated-hardware-table", t("Team watchlist"), "table", 12,
          <TableCard id="curated-hardware-table" queryId="curated_hardware_watchlist" title={t("User-curated open hardware")} rows={curatedHardware} searchable
            description={t("User-selected ongoing project; current cumulative metadata, not a Trending entry.")}
            columns={[
              projectColumn,
              { field: "signal", label: t("Community signal") },
              { field: "license", label: t("License") },
              { field: "lastPush", label: t("Last push") },
              { field: "stage", label: t("Stage") },
              { field: "category", label: t("Focus") },
              { field: "summary", label: t("Highlights") },
              { field: "risk", label: t("Risks") },
            ]} />)}
        {item("oshw-favorites", t("OSHWHub favorites"), "chart", 12,
          <EvidenceChart id="oshw-favorites" queryId="oshwhub_current" title={t("OSHWHub candidates: cumulative favorites")}
            variant="card" rows={[...oshw].sort((a, b) => b.favorites - a.favorites)} sourceRows={oshw} height={360}
            description={t("Official project search-index snapshots; Explore returned 403. Counts are cumulative.")}
            spec={{ type: "horizontalBar", x: "project", y: "favorites", showValues: true, sortOrder: "descending", showXAxisLabel: false, showYAxisLabel: false }} />)}
        {item("oshw-table", t("OSHWHub candidates"), "table", 12,
          <TableCard id="oshw-table" queryId="oshwhub_current" title={t("China hardware candidates")} rows={oshw} searchable
            columns={[projectColumn, { field: "category", label: t("Focus") }, { field: "views", label: t("Views") }, { field: "likes", label: t("Likes") }, { field: "favorites", label: t("Favorites") }, { field: "comments", label: t("Comments") }]} />)}
      </Canvas>
    );
  }

  if (tab === "crowdfunding") {
    return (
      <Canvas id="open-source:crowdfunding:canvas" rows={[
        { id: "crowdfunding:metrics", kind: "metrics", items: ["kpi-kickstarter", "kpi-indiegogo"] },
        { id: "crowdfunding:charts", items: ["kickstarter-backers", "indiegogo-backers"], header: <SectionHeader id="crowdfunding-chart-heading" title={t("Current candidates")} /> },
        { id: "crowdfunding:tables", items: ["kickstarter-table", "indiegogo-table"] },
      ]}>
        {item("kpi-kickstarter", t("Kickstarter candidates"), "metric", 6,
          <MetricCard id="kpi-kickstarter" queryId="kickstarter_current" title={t("Kickstarter candidates")}
            value={integer.format(kickstarter.length)} sourceRows={kickstarter} displayRows={kickstarter}
            description={t("Current candidates cross-checked against official pages; not official popularity ranks.")} />, 3)}
        {item("kpi-indiegogo", t("Indiegogo follow-up candidates"), "metric", 6,
          <MetricCard id="kpi-indiegogo" queryId="indiegogo_current" title={t("Indiegogo follow-up candidates")}
            value={integer.format(indiegogo.length)} sourceRows={indiegogo} displayRows={indiegogo}
            description={t("Includes prelaunch, indexed rewards and historical follow-up with explicit verification limits.")} />, 3)}
        {item("kickstarter-backers", t("Kickstarter backers"), "chart", 6,
          <EvidenceChart id="kickstarter-backers" queryId="kickstarter_current" title={t("Kickstarter: cumulative backers")}
            variant="card" rows={kickstarter} sourceRows={kickstarter} height={330}
            description={t("Current cumulative supporters, including ended campaigns; unavailable values stay null.")}
            spec={{ type: "horizontalBar", x: "project", y: "backers", showValues: true, sortOrder: "descending", showXAxisLabel: false, showYAxisLabel: false }} />)}
        {item("indiegogo-backers", t("Indiegogo evidence"), "chart", 6,
          <DataComponent id="indiegogo-backers" queryId="indiegogo_current" title={t("Indiegogo: current counts unavailable")}
            kind="custom" variant="card" sourceRows={indiegogo} displayRows={indiegogo}>
            <p data-reviewed-rows>{t("No current backer totals could be verified. TypAir has indexed rewards; EveryMIDI AT is prelaunch. Historical counts appear only as dated notes below.")}</p>
          </DataComponent>)}
        {item("kickstarter-table", t("Kickstarter details"), "table", 6,
          <TableCard id="kickstarter-table" queryId="kickstarter_current" title={t("Kickstarter technology candidates")} rows={kickstarter}
            description={t("Current official-page snapshots; click a name to inspect the source.")}
            columns={[
              { field: "rank", label: "#" }, projectColumn,
              { field: "backers", label: t("Backers"), renderCell: value => Number.isFinite(value) ? integer.format(value) : t("Unavailable") },
              { field: "raisedDisplay", label: t("Funding evidence") },
              { field: "status", label: t("Stage") },
              { field: "category", label: t("Focus") },
              { field: "summary", label: t("Highlights") },
            ]} />)}
        {item("indiegogo-table", t("Indiegogo details"), "table", 6,
          <TableCard id="indiegogo-table" queryId="indiegogo_current" title={t("Indiegogo: prelaunch and follow-up")} rows={indiegogo}
            description={t("Official indexed evidence with its limits; followers are not backers.")}
            columns={[
              { field: "rank", label: "#" }, projectColumn,
              { field: "backersDisplay", label: t("Backers") },
              { field: "raisedDisplay", label: t("Funding evidence") },
              { field: "status", label: t("Stage") },
              { field: "category", label: t("Focus") },
              { field: "summary", label: t("Highlights") },
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
        {item("kpi-instructables-weekly", t("Seven-day additions"), "metric", 4,
          <MetricCard id="kpi-instructables-weekly" queryId="instructables_freshness" title={t("Seven-day additions")}
            value={Number.isFinite(fusionFreshness.weeklyNew) ? integer.format(fusionFreshness.weeklyNew) : t("Unknown")} sourceRows={instructablesFreshness} displayRows={instructablesFreshness}
            description={t("Oct 12–19 review: filtered list unavailable. Unknown is not zero.")} />, 2)}
        {item("kpi-instructables-count", t("Current Fusion projects"), "metric", 4,
          <MetricCard id="kpi-instructables-count" queryId="instructables_freshness" title={t("Current Fusion projects")}
            value={Number.isFinite(fusionFreshness.visibleProjects) ? integer.format(fusionFreshness.visibleProjects) : t("Unknown")} sourceRows={instructablesFreshness} displayRows={instructablesFreshness}
            description={t("Current filtered project count is unavailable.")} />, 2)}
        {item("kpi-instructables-latest", t("Latest date"), "metric", 4,
          <MetricCard id="kpi-instructables-latest" queryId="instructables_freshness" title={t("Latest date")}
            value={fusionFreshness.latestPublished ?? "—"} sourceRows={instructablesFreshness} displayRows={instructablesFreshness}
            description={(language === "zh" ? fusionFreshness.zh?.latestProject : fusionFreshness.latestProject) ?? t("Latest project")} />, 2)}
        {item("instructables-favorites", t("Fusion historical favorites"), "chart", 12,
          <EvidenceChart id="instructables-favorites" queryId="instructables_fusion" title={t("Teachers + Fusion: historical favorites")}
            variant="card" rows={instructables} sourceRows={instructables} height={420}
            description={t("Retained Sep 2 cumulative snapshot. Current Fusion list is unavailable.")}
            spec={{ type: "horizontalBar", x: "project", y: "favorites", showValues: true, sortOrder: "descending", showXAxisLabel: false, showYAxisLabel: false }} />)}
        {item("instructables-table", t("Instructables details"), "table", 12,
          <TableCard id="instructables-table" queryId="instructables_fusion" title={t("Fusion projects: Sep 2 snapshot")} rows={instructables} searchable
            columns={[projectColumn, { field: "category", label: t("Focus") }, { field: "favorites", label: t("Favorites") }, { field: "views", label: t("Views") }, { field: "madeIts", label: t("Builds"), renderCell: value => value == null ? "—" : integer.format(value) }]} />)}
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
        {item("kpi-core-relevant", t("Core-relevant projects"), "metric", 4,
          <MetricCard id="kpi-core-relevant" queryId="product_watchlist" title={t("Core-relevant projects")}
            value={integer.format(coreRelevantCount)} sourceRows={watchlist} displayRows={watchlist.filter(row => row.inputRelevance >= 4 || row.aiInput >= 4)}
            description={t("Input relevance or AI input >= 4/5.")} />, 2)}
        {item("kpi-ai-input", t("AI input"), "metric", 4,
          <MetricCard id="kpi-ai-input" queryId="product_watchlist" title={t("AI input")}
            value={integer.format(aiInputCount)} sourceRows={watchlist} displayRows={watchlist.filter(row => row.aiInput >= 4)}
            description={t("Voice, vision, gesture, context or Agent-driven input; AI score >= 4/5.")} />, 2)}
        {item("kpi-frontier", t("Frontier hardware"), "metric", 4,
          <MetricCard id="kpi-frontier" queryId="product_watchlist" title={t("Frontier hardware")}
            value={integer.format(frontierCount)} sourceRows={watchlist} displayRows={watchlist.filter(row => row.isHardware === true && row.breakthrough >= 4 && row.wonder >= 4)}
            description={t("Hardware only, with breakthrough and novelty both >= 4/5; low heat is allowed.")} />, 2)}
        {item("watchlist-score", t("Product opportunity score"), "chart", 12,
          <EvidenceChart id="watchlist-score" queryId="product_watchlist" title={t("Product opportunity score")}
            variant="card" rows={watchlist} sourceRows={watchlist} height={600}
            description={t("Editorial 20–100 score. Input×6 + AI×4 + breakthrough×4 + market×3 + novelty×2 + heat×1. Heat weight: 5%.")}
            spec={{ type: "horizontalBar", x: "project", y: "score", showValues: true, sortOrder: "descending", showXAxisLabel: false, showYAxisLabel: false }} />)}
        {item("watchlist-summary", t("Opportunity framework"), "custom", 12,
          <DataComponent id="watchlist-summary" queryId="product_watchlist" title={t("Core and frontier selection")}
            kind="custom" variant="card" sourceRows={watchlist} displayRows={watchlist}
            description={t("Core relevance plus a hardware-only frontier exception. Scores are editorial judgments.")}>
            <div className="osw-watch-summary" data-reviewed-rows>
              <div><strong>{t("Core / 核心相关")}</strong><span>{t("Input relevance or AI input ≥4/5. Prioritize keyboards, pointing devices, controllers and desktop workflows.")}</span></div>
              <div><strong>{t("Frontier / 前沿破格")}</strong><span>{t("Hardware only: breakthrough and novelty both ≥4/5. Low heat and prelaunch projects can qualify.")}</span></div>
              <div><strong>{t("Evidence and risk / 风险")}</strong><span>{t("Heat is 5% of score weight. Licensing, maturity, privacy, specifications and delivery are separate checks.")}</span></div>
            </div>
          </DataComponent>)}
        {item("watchlist-table", t("Opportunity details"), "table", 12,
          <TableCard id="watchlist-table" queryId="product_watchlist" title={t("Product opportunities and frontier hardware")} rows={watchlist} searchable
            columns={[
              { field: "priority", label: t("Priority") }, projectColumn,
              { field: "summary", label: t("Summary") },
              { field: "track", label: t("Opportunity") },
              { field: "selectionPath", label: t("Selection path") },
              { field: "signal", label: t("Evidence / heat") },
              { field: "stage", label: t("Project stage") },
              { field: "risk", label: t("Risks") },
              { field: "technology", label: t("Key technology") },
              { field: "openness", label: t("License / openness") },
              { field: "observedAt", label: t("Checked (UTC)") },
              { field: "inputRelevance", label: t("Input relevance"), renderCell: value => <span className="osw-relevance">{value}/5</span> },
              { field: "aiInput", label: t("AI input"), renderCell: value => <span className="osw-relevance">{value}/5</span> },
              { field: "breakthrough", label: t("Breakthrough"), renderCell: value => <span className="osw-relevance">{value}/5</span> },
              { field: "potential", label: t("Market potential"), renderCell: value => <span className="osw-relevance">{value}/5</span> },
              { field: "wonder", label: t("Novelty"), renderCell: value => <span className="osw-relevance">{value}/5</span> },
              { field: "heat", label: t("Heat (5%)"), renderCell: value => <span className="osw-relevance">{value}/5</span> },
              { field: "score", label: t("Score") },
              { field: "takeaway", label: t("Keychron takeaway") },
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
      {item("kpi-top-stars", t("Top new-repo stars"), "metric", 3,
        <MetricCard id="kpi-top-stars" queryId="github_weekly" title={t("Top new-repo stars")} value={compact.format(topWeeklyStars ?? 0)}
          sourceRows={github} displayRows={github.slice(0, 1)} description={language === "zh" ? `${github[0]?.project ?? "—"}，当前新仓库候选。` : `${github[0]?.project ?? "—"}, current new-repository candidate.`} />, 2)}
      {item("kpi-ai-share", t("AI share"), "metric", 3,
        <MetricCard id="kpi-ai-share" queryId="github_weekly" title={t("AI share")} value={`${Math.round(aiShare * 100)}%`}
          sourceRows={github} displayRows={categoryRows} description={language === "zh" ? `${github.length} 个候选中有 ${aiCount} 个归类为 AI 相关。` : `${aiCount} / ${github.length} candidates classified as AI-related.`} />, 2)}
      {item("kpi-hardware-posts", t("Recent hardware stories"), "metric", 3,
        <MetricCard id="kpi-hardware-posts" queryId="hackaday_weekly" title={t("Recent hardware stories")} value={integer.format(hackaday.length)}
          sourceRows={hackaday} displayRows={hackaday} description={t("Selected Hackaday stories published within the seven-day review window.")} />, 2)}
      {item("kpi-instructables-weekly", t("Fusion seven-day additions"), "metric", 3,
        <MetricCard id="kpi-instructables-weekly" queryId="instructables_freshness" title={t("Fusion seven-day additions")} value={Number.isFinite(fusionFreshness.weeklyNew) ? integer.format(fusionFreshness.weeklyNew) : t("Unknown")}
          sourceRows={instructablesFreshness} displayRows={instructablesFreshness} description={t("Oct 19 check returned Loading. Current additions and latest date are unknown.")} />, 2)}
      {item("github-stars", t("New-repository stars"), "chart", 8,
        <EvidenceChart id="github-stars" queryId="github_weekly" title={t("New-repository candidates: stars")}
          variant="card" rows={github} sourceRows={github} height={410}
          description={t("Current stars for new repositories; no cross-platform aggregation.")}
          spec={{ type: "horizontalBar", x: "project", y: "weeklyStars", showValues: true, sortOrder: "descending", showXAxisLabel: false, showYAxisLabel: false }} />)}
      {item("category-mix", t("GitHub category mix"), "chart", 4,
        <EvidenceChart id="category-mix" queryId="github_weekly" title={t("Candidate category mix")}
          variant="card" rows={categoryRows} sourceRows={github} height={410}
          description={t("Manual classification from official repository descriptions.")}
          spec={{ type: "pie", x: "category", y: "projects", showValues: true, showXAxisLabel: false, showYAxisLabel: false }} />)}
      {item("signal-summary", t("This week's signals"), "custom", 12,
        <DataComponent id="signal-summary" queryId="github_weekly"
          queryIds={["github_weekly", "hackaday_weekly", "product_watchlist"]}
          title={t("Three signals for the team")} kind="custom" variant="card"
          sourceRows={github}
          sourceRowsByQuery={{
            github_weekly: github,
            hackaday_weekly: hackaday,
            product_watchlist: watchlist,
          }}
          displayRows={[]}
          description={t("Source-backed input and hardware signals; product implications are editorial judgments.")}>
          <div className="osw-signal-grid">
            <article><span>01</span><strong>{t("Human approval becomes a hardware function")}</strong><p>{t("Zhiyan combines voice, accept/reject keys and Agent state. immurok proposes fingerprint approval for individual Agent commands; security and license boundaries remain critical.")}</p></article>
            <article><span>02</span><strong>{t("Open sensing does not mean validated haptics")}</strong><p>{t("TAKTO exposes joint sensing and tendon actuation, but force rendering and latency are not yet measured. Separate sensing, actuation and wearable validation in product trials.")}</p></article>
            <article><span>03</span><strong>{t("Commodity radios become experimental instruments")}</strong><p>{t("BirriaSDR and LR2021-SDR expose raw radio signals. They suggest lower-cost RF diagnostics, while calibration and board differences prevent treating them as reference instruments.")}</p></article>
          </div>
        </DataComponent>)}
    </Canvas>
  );
}
