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
  { id: "dashboard", label: "Overview 总览" },
  { id: "software", label: "Software 软件" },
  { id: "hardware", label: "Hardware 硬件" },
  { id: "crowdfunding", label: "Crowdfunding 众筹" },
  { id: "instructables", label: "Instructables" },
  { id: "watchlist", label: "Opportunities 产品机会" },
];

const compact = new Intl.NumberFormat("zh-CN", { notation: "compact", maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 0 });
const money = new Intl.NumberFormat("zh-CN", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const projectColumn = {
  field: "project",
  label: "Project",
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
      label="Open-source radar modules"
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
  const frontierCount = watchlist.filter(row => row.isHardware === true && row.breakthrough >= 4 && row.wonder >= 4).length;

  const aiCount = github.filter(row => row.category.includes("AI") || row.category === "LLM infrastructure").length;
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
        { id: "software:china", items: ["oschina-table"], header: <SectionHeader id="software-china-heading" title="China release signals" /> },
      ]}>
        {item("github-stars", "New-repository stars", "chart", 12,
          <EvidenceChart id="github-stars" queryId="github_weekly" title="New-repository candidates: stars"
            variant="card" rows={github} sourceRows={github} height={410}
            description="Oct 12–19 new-repository candidates. Official metadata snapshots; Trending was unavailable. One out-of-scope adult-image repository excluded."
            spec={{ type: "horizontalBar", x: "project", y: "weeklyStars", showValues: true, sortOrder: "descending", showXAxisLabel: false, showYAxisLabel: false }} />)}
        {item("github-table", "GitHub candidates", "table", 12,
          <TableCard id="github-table" queryId="github_weekly" title="GitHub candidates" rows={github} searchable
            description="Current stars on repositories created within the window; names open official repositories."
            columns={[
              { field: "rank", label: "#" }, projectColumn,
              { field: "weeklyStars", label: "New-repo stars" },
              { field: "totalStars", label: "Total stars" },
              { field: "category", label: "Category" },
              { field: "region", label: "Community" },
              { field: "summary", label: "Highlights" },
            ]} />)}
        {item("oschina-table", "China release signals", "table", 12,
          <TableCard id="oschina-table" queryId="oschina_releases" title="Recent OSCHINA releases" rows={oschina}
            description="Dated releases from Oct 12–19; editorial exposure, not a popularity rank."
            columns={[projectColumn, { field: "date", label: "Published" }, { field: "category", label: "Category" }, { field: "summary", label: "Release notes" }]} />)}
      </Canvas>
    );
  }

  if (tab === "hardware") {
    return (
      <Canvas id="open-source:hardware:canvas" rows={[
        { id: "hardware:weekly", items: ["hackaday-comments", "crowd-backers"], header: <SectionHeader id="hardware-weekly-heading" title="Open hardware signals" /> },
        { id: "hardware:details", items: ["hackaday-table", "crowd-table"] },
        { id: "hardware:maker-platforms", items: ["maker-platforms-table"], header: <SectionHeader id="hardware-maker-heading" title="Maker and input-device signals" /> },
        { id: "hardware:beekeeb", items: ["beekeeb-table"], header: <SectionHeader id="hardware-beekeeb-heading" title="Keyboard and input modules" /> },
        { id: "hardware:curated", items: ["curated-hardware-table"], header: <SectionHeader id="hardware-curated-heading" title="Team watchlist" /> },
        { id: "hardware:china", items: ["oshw-favorites"], header: <SectionHeader id="hardware-china-heading" title="China hardware community" /> },
        { id: "hardware:china-table", items: ["oshw-table"] },
      ]}>
        {item("hackaday-comments", "Hackaday discussion", "chart", 7,
          <EvidenceChart id="hackaday-comments" queryId="hackaday_weekly" title="Recent articles: cumulative comments"
            variant="card" rows={hackaday} sourceRows={hackaday} height={290}
            description="Articles published in the review window; comments are cumulative snapshots."
            spec={{ type: "horizontalBar", x: "project", y: "comments", showValues: true, sortOrder: "descending", showXAxisLabel: false, showYAxisLabel: false }} />)}
        {item("crowd-backers", "Crowd Supply backers", "chart", 5,
          <EvidenceChart id="crowd-backers" queryId="crowdsupply_current" title="Campaigns: cumulative backers"
            variant="card" rows={crowd} sourceRows={crowd} height={290}
            description="Cumulative supporters. Table shows differences from the Oct 12 snapshot, not exact 168-hour growth."
            spec={{ type: "bar", x: "project", y: "backers", showValues: true, sortOrder: "descending", xTickLabelLayout: "wrap", showXAxisLabel: false, showYAxisLabel: false }} />)}
        {item("hackaday-table", "Hackaday stories", "table", 7,
          <TableCard id="hackaday-table" queryId="hackaday_weekly" title="Recent hardware stories" rows={hackaday}
            columns={[projectColumn, { field: "date", label: "Published" }, { field: "comments", label: "Comments" }, { field: "category", label: "Focus" }, { field: "summary", label: "Highlights" }]} />)}
        {item("crowd-table", "Crowd Supply projects", "table", 5,
          <TableCard id="crowd-table" queryId="crowdsupply_current" title="Campaign and pre-order snapshots" rows={crowd}
            columns={[
              projectColumn,
              { field: "backers", label: "Backers" },
              { field: "fundingPercent", label: "Funded", renderCell: value => value == null ? "—" : `${integer.format(value)}%` },
              { field: "raisedUsd", label: "Raised", renderCell: value => money.format(value) },
              { field: "change", label: "Change vs Oct 12" },
              { field: "stage", label: "Stage" },
            ]} />)}
        {item("maker-platforms-table", "Maker candidates", "table", 12,
          <TableCard id="maker-platforms-table" queryId="maker_platforms_current" title="Hackster, Arduino and Tindie candidates" rows={makerPlatforms} searchable
            description="Publication dates, cumulative views and maker availability claims are separate signals."
            columns={[
              { field: "platform", label: "Platform" }, projectColumn,
              { field: "signal", label: "Evidence / heat" },
              { field: "stage", label: "Stage" },
              { field: "category", label: "Focus" },
              { field: "summary", label: "Highlights" },
            ]} />)}
        {item("beekeeb-table", "BeeKeeb candidates", "table", 12,
          <TableCard id="beekeeb-table" queryId="beekeeb_current" title="BeeKeeb: current product candidates" rows={beekeeb} searchable
            description="No public weekly sales. Homepage exposure and product-page prices are candidates, not sales ranks."
            columns={[
              projectColumn,
              { field: "signal", label: "Current signal" },
              { field: "stage", label: "Stage" },
              { field: "category", label: "Focus" },
              { field: "summary", label: "Product notes" },
              { field: "risk", label: "Verification risks" },
            ]} />)}
        {item("curated-hardware-table", "Team watchlist", "table", 12,
          <TableCard id="curated-hardware-table" queryId="curated_hardware_watchlist" title="User-curated open hardware" rows={curatedHardware} searchable
            description="User-selected ongoing project; current cumulative metadata, not a Trending entry."
            columns={[
              projectColumn,
              { field: "signal", label: "Community signal" },
              { field: "license", label: "License" },
              { field: "lastPush", label: "Last push" },
              { field: "stage", label: "Stage" },
              { field: "category", label: "Focus" },
              { field: "summary", label: "Highlights" },
              { field: "risk", label: "Risks" },
            ]} />)}
        {item("oshw-favorites", "OSHWHub favorites", "chart", 12,
          <EvidenceChart id="oshw-favorites" queryId="oshwhub_current" title="OSHWHub candidates: cumulative favorites"
            variant="card" rows={[...oshw].sort((a, b) => b.favorites - a.favorites)} sourceRows={oshw} height={360}
            description="Official project search-index snapshots; Explore returned 403. Counts are cumulative."
            spec={{ type: "horizontalBar", x: "project", y: "favorites", showValues: true, sortOrder: "descending", showXAxisLabel: false, showYAxisLabel: false }} />)}
        {item("oshw-table", "OSHWHub candidates", "table", 12,
          <TableCard id="oshw-table" queryId="oshwhub_current" title="China hardware candidates" rows={oshw} searchable
            columns={[projectColumn, { field: "category", label: "Focus" }, { field: "views", label: "Views" }, { field: "likes", label: "Likes" }, { field: "favorites", label: "Favorites" }, { field: "comments", label: "Comments" }]} />)}
      </Canvas>
    );
  }

  if (tab === "crowdfunding") {
    return (
      <Canvas id="open-source:crowdfunding:canvas" rows={[
        { id: "crowdfunding:metrics", kind: "metrics", items: ["kpi-kickstarter", "kpi-indiegogo"] },
        { id: "crowdfunding:charts", items: ["kickstarter-backers", "indiegogo-backers"], header: <SectionHeader id="crowdfunding-chart-heading" title="Current candidates" /> },
        { id: "crowdfunding:tables", items: ["kickstarter-table", "indiegogo-table"] },
      ]}>
        {item("kpi-kickstarter", "Kickstarter candidates", "metric", 6,
          <MetricCard id="kpi-kickstarter" queryId="kickstarter_current" title="Kickstarter candidates"
            value={integer.format(kickstarter.length)} sourceRows={kickstarter} displayRows={kickstarter}
            description="Current candidates cross-checked against official pages; not official popularity ranks." />, 3)}
        {item("kpi-indiegogo", "Indiegogo follow-up candidates", "metric", 6,
          <MetricCard id="kpi-indiegogo" queryId="indiegogo_current" title="Indiegogo follow-up candidates"
            value={integer.format(indiegogo.length)} sourceRows={indiegogo} displayRows={indiegogo}
            description="Includes prelaunch, indexed rewards and historical follow-up with explicit verification limits." />, 3)}
        {item("kickstarter-backers", "Kickstarter backers", "chart", 6,
          <EvidenceChart id="kickstarter-backers" queryId="kickstarter_current" title="Kickstarter: cumulative backers"
            variant="card" rows={kickstarter} sourceRows={kickstarter} height={330}
            description="Current cumulative supporters, including ended campaigns; unavailable values stay null."
            spec={{ type: "horizontalBar", x: "project", y: "backers", showValues: true, sortOrder: "descending", showXAxisLabel: false, showYAxisLabel: false }} />)}
        {item("indiegogo-backers", "Indiegogo evidence", "chart", 6,
          <DataComponent id="indiegogo-backers" queryId="indiegogo_current" title="Indiegogo: current counts unavailable"
            kind="custom" variant="card" sourceRows={indiegogo} displayRows={indiegogo}>
            <p data-reviewed-rows>No current backer totals could be verified. TypAir has indexed rewards; EveryMIDI AT is prelaunch. Historical counts appear only as dated notes below.</p>
          </DataComponent>)}
        {item("kickstarter-table", "Kickstarter details", "table", 6,
          <TableCard id="kickstarter-table" queryId="kickstarter_current" title="Kickstarter technology candidates" rows={kickstarter}
            description="Current official-page snapshots; click a name to inspect the source."
            columns={[
              { field: "rank", label: "#" }, projectColumn,
              { field: "backers", label: "Backers", renderCell: value => Number.isFinite(value) ? integer.format(value) : "Unavailable" },
              { field: "raisedDisplay", label: "Funding evidence" },
              { field: "status", label: "Stage" },
              { field: "category", label: "Focus" },
              { field: "summary", label: "Highlights" },
            ]} />)}
        {item("indiegogo-table", "Indiegogo details", "table", 6,
          <TableCard id="indiegogo-table" queryId="indiegogo_current" title="Indiegogo: prelaunch and follow-up" rows={indiegogo}
            description="Official indexed evidence with its limits; followers are not backers."
            columns={[
              { field: "rank", label: "#" }, projectColumn,
              { field: "backersDisplay", label: "Backers" },
              { field: "raisedDisplay", label: "Funding evidence" },
              { field: "status", label: "Stage" },
              { field: "category", label: "Focus" },
              { field: "summary", label: "Highlights" },
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
        {item("kpi-instructables-weekly", "Seven-day additions", "metric", 4,
          <MetricCard id="kpi-instructables-weekly" queryId="instructables_freshness" title="Seven-day additions"
            value={Number.isFinite(fusionFreshness.weeklyNew) ? integer.format(fusionFreshness.weeklyNew) : "Unknown"} sourceRows={instructablesFreshness} displayRows={instructablesFreshness}
            description="Oct 12–19 review: filtered list unavailable. Unknown is not zero." />, 2)}
        {item("kpi-instructables-count", "Current Fusion projects", "metric", 4,
          <MetricCard id="kpi-instructables-count" queryId="instructables_freshness" title="Current Fusion projects"
            value={Number.isFinite(fusionFreshness.visibleProjects) ? integer.format(fusionFreshness.visibleProjects) : "Unknown"} sourceRows={instructablesFreshness} displayRows={instructablesFreshness}
            description="Current filtered project count is unavailable." />, 2)}
        {item("kpi-instructables-latest", "Latest date", "metric", 4,
          <MetricCard id="kpi-instructables-latest" queryId="instructables_freshness" title="Latest date"
            value={fusionFreshness.latestPublished ?? "—"} sourceRows={instructablesFreshness} displayRows={instructablesFreshness}
            description={fusionFreshness.latestProject ?? "Latest project"} />, 2)}
        {item("instructables-favorites", "Fusion historical favorites", "chart", 12,
          <EvidenceChart id="instructables-favorites" queryId="instructables_fusion" title="Teachers + Fusion: historical favorites"
            variant="card" rows={instructables} sourceRows={instructables} height={420}
            description="Retained Sep 2 cumulative snapshot. Current Fusion list is unavailable."
            spec={{ type: "horizontalBar", x: "project", y: "favorites", showValues: true, sortOrder: "descending", showXAxisLabel: false, showYAxisLabel: false }} />)}
        {item("instructables-table", "Instructables details", "table", 12,
          <TableCard id="instructables-table" queryId="instructables_fusion" title="Fusion projects: Sep 2 snapshot" rows={instructables} searchable
            columns={[projectColumn, { field: "category", label: "Focus" }, { field: "favorites", label: "Favorites" }, { field: "views", label: "Views" }, { field: "madeIts", label: "Builds", renderCell: value => value == null ? "—" : integer.format(value) }]} />)}
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
        {item("kpi-core-relevant", "Core-relevant projects", "metric", 4,
          <MetricCard id="kpi-core-relevant" queryId="product_watchlist" title="Core-relevant projects"
            value={integer.format(coreRelevantCount)} sourceRows={watchlist} displayRows={watchlist.filter(row => row.inputRelevance >= 4 || row.aiInput >= 4)}
            description="Input relevance or AI input >= 4/5." />, 2)}
        {item("kpi-ai-input", "AI input", "metric", 4,
          <MetricCard id="kpi-ai-input" queryId="product_watchlist" title="AI input"
            value={integer.format(aiInputCount)} sourceRows={watchlist} displayRows={watchlist.filter(row => row.aiInput >= 4)}
            description="Voice, vision, gesture, context or Agent-driven input; AI score >= 4/5." />, 2)}
        {item("kpi-frontier", "Frontier hardware", "metric", 4,
          <MetricCard id="kpi-frontier" queryId="product_watchlist" title="Frontier hardware"
            value={integer.format(frontierCount)} sourceRows={watchlist} displayRows={watchlist.filter(row => row.isHardware === true && row.breakthrough >= 4 && row.wonder >= 4)}
            description="Hardware only, with breakthrough and novelty both >= 4/5; low heat is allowed." />, 2)}
        {item("watchlist-score", "Product opportunity score", "chart", 12,
          <EvidenceChart id="watchlist-score" queryId="product_watchlist" title="Product opportunity score"
            variant="card" rows={watchlist} sourceRows={watchlist} height={600}
            description="Editorial 20–100 score. Input×6 + AI×4 + breakthrough×4 + market×3 + novelty×2 + heat×1. Heat weight: 5%."
            spec={{ type: "horizontalBar", x: "project", y: "score", showValues: true, sortOrder: "descending", showXAxisLabel: false, showYAxisLabel: false }} />)}
        {item("watchlist-summary", "Opportunity framework", "custom", 12,
          <DataComponent id="watchlist-summary" queryId="product_watchlist" title="Core and frontier selection"
            kind="custom" variant="card" sourceRows={watchlist} displayRows={watchlist}
            description="Core relevance plus a hardware-only frontier exception. Scores are editorial judgments.">
            <div className="osw-watch-summary" data-reviewed-rows>
              <div><strong>Core / 核心相关</strong><span>Input relevance or AI input ≥4/5. Prioritize keyboards, pointing devices, controllers and desktop workflows.</span></div>
              <div><strong>Frontier / 前沿破格</strong><span>Hardware only: breakthrough and novelty both ≥4/5. Low heat and prelaunch projects can qualify.</span></div>
              <div><strong>Evidence and risk / 风险</strong><span>Heat is 5% of score weight. Licensing, maturity, privacy, specifications and delivery are separate checks.</span></div>
            </div>
          </DataComponent>)}
        {item("watchlist-table", "Opportunity details", "table", 12,
          <TableCard id="watchlist-table" queryId="product_watchlist" title="Product opportunities and frontier hardware" rows={watchlist} searchable
            columns={[
              { field: "priority", label: "Priority" }, projectColumn,
              { field: "track", label: "Opportunity" },
              { field: "selectionPath", label: "Selection path" },
              { field: "signal", label: "Evidence / heat" },
              { field: "stage", label: "Project stage" },
              { field: "risk", label: "Risks" },
              { field: "technology", label: "Key technology" },
              { field: "openness", label: "License / openness" },
              { field: "observedAt", label: "Checked (UTC)" },
              { field: "inputRelevance", label: "Input relevance", renderCell: value => <span className="osw-relevance">{value}/5</span> },
              { field: "aiInput", label: "AI input", renderCell: value => <span className="osw-relevance">{value}/5</span> },
              { field: "breakthrough", label: "Breakthrough", renderCell: value => <span className="osw-relevance">{value}/5</span> },
              { field: "potential", label: "Market potential", renderCell: value => <span className="osw-relevance">{value}/5</span> },
              { field: "wonder", label: "Novelty", renderCell: value => <span className="osw-relevance">{value}/5</span> },
              { field: "heat", label: "Heat (5%)", renderCell: value => <span className="osw-relevance">{value}/5</span> },
              { field: "score", label: "Score" },
              { field: "takeaway", label: "Keychron takeaway" },
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
      {item("kpi-top-stars", "Top new-repo stars", "metric", 3,
        <MetricCard id="kpi-top-stars" queryId="github_weekly" title="Top new-repo stars" value={compact.format(topWeeklyStars ?? 0)}
          sourceRows={github} displayRows={github.slice(0, 1)} description={`${github[0]?.project ?? "—"}，current new-repository candidate.`} />, 2)}
      {item("kpi-ai-share", "AI share", "metric", 3,
        <MetricCard id="kpi-ai-share" queryId="github_weekly" title="AI share" value={`${Math.round(aiShare * 100)}%`}
          sourceRows={github} displayRows={categoryRows} description={`${aiCount} / ${github.length} candidates classified as AI-related.`} />, 2)}
      {item("kpi-hardware-posts", "Recent hardware stories", "metric", 3,
        <MetricCard id="kpi-hardware-posts" queryId="hackaday_weekly" title="Recent hardware stories" value={integer.format(hackaday.length)}
          sourceRows={hackaday} displayRows={hackaday} description="Selected Hackaday stories published within the seven-day review window." />, 2)}
      {item("kpi-instructables-weekly", "Fusion seven-day additions", "metric", 3,
        <MetricCard id="kpi-instructables-weekly" queryId="instructables_freshness" title="Fusion seven-day additions" value={Number.isFinite(fusionFreshness.weeklyNew) ? integer.format(fusionFreshness.weeklyNew) : "Unknown"}
          sourceRows={instructablesFreshness} displayRows={instructablesFreshness} description="Oct 19 check returned Loading. Current additions and latest date are unknown." />, 2)}
      {item("github-stars", "New-repository stars", "chart", 8,
        <EvidenceChart id="github-stars" queryId="github_weekly" title="New-repository candidates: stars"
          variant="card" rows={github} sourceRows={github} height={410}
          description="Current stars for new repositories; no cross-platform aggregation."
          spec={{ type: "horizontalBar", x: "project", y: "weeklyStars", showValues: true, sortOrder: "descending", showXAxisLabel: false, showYAxisLabel: false }} />)}
      {item("category-mix", "GitHub category mix", "chart", 4,
        <EvidenceChart id="category-mix" queryId="github_weekly" title="Candidate category mix"
          variant="card" rows={categoryRows} sourceRows={github} height={410}
          description="Manual classification from official repository descriptions."
          spec={{ type: "pie", x: "category", y: "projects", showValues: true, showXAxisLabel: false, showYAxisLabel: false }} />)}
      {item("signal-summary", "This week's signals", "custom", 12,
        <DataComponent id="signal-summary" queryId="github_weekly"
          queryIds={["github_weekly", "hackaday_weekly", "product_watchlist"]}
          title="Three signals for the team" kind="custom" variant="card"
          sourceRows={github}
          sourceRowsByQuery={{
            github_weekly: github,
            hackaday_weekly: hackaday,
            product_watchlist: watchlist,
          }}
          displayRows={[]}
          description="Source-backed input and hardware signals; product implications are editorial judgments.">
          <div className="osw-signal-grid">
            <article><span>01</span><strong>Human approval becomes a hardware function</strong><p>Zhiyan combines voice, accept/reject keys and Agent state. immurok proposes fingerprint approval for individual Agent commands; security and license boundaries remain critical.</p></article>
            <article><span>02</span><strong>Open sensing does not mean validated haptics</strong><p>TAKTO exposes joint sensing and tendon actuation, but force rendering and latency are not yet measured. Separate sensing, actuation and wearable validation in product trials.</p></article>
            <article><span>03</span><strong>Commodity radios become experimental instruments</strong><p>BirriaSDR and LR2021-SDR expose raw radio signals. They suggest lower-cost RF diagnostics, while calibration and board differences prevent treating them as reference instruments.</p></article>
          </div>
        </DataComponent>)}
    </Canvas>
  );
}
