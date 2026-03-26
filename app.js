/* ============================================
   CEO PERFORMANCE SUITE — V10 Strategic Dashboards
   8 tabs, strategic headlines, REP_DATA integration
   ============================================ */

(function () {
  "use strict";

  // Register datalabels plugin globally
  Chart.register(ChartDataLabels);

  // ── Palette ──
  const C = {
    indigo: "#6366F1",
    indigoFade: "rgba(99,102,241,0.15)",
    cyan: "#06B6D4",
    cyanFade: "rgba(6,182,212,0.15)",
    amber: "#F59E0B",
    amberFade: "rgba(245,158,11,0.12)",
    emerald: "#10B981",
    emeraldFade: "rgba(16,185,129,0.12)",
    red: "#EF4444",
    redFade: "rgba(239,68,68,0.12)",
    purple: "#A855F7",
    purpleFade: "rgba(168,85,247,0.15)",
    text: "#F1F5F9",
    textSec: "#94A3B8",
    textMuted: "#64748B",
    gridLine: "rgba(148,163,184,0.04)",
  };

  // ── Helpers ──
  const $ = (s) => document.querySelector(s);
  const labels = D.map((d) => d.short);
  const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const col = (field) => D.map((d) => d[field]);
  const fmtK = (v) => {
    if (v === undefined || v === null) return "—";
    if (Math.abs(v) >= 1e6) return "$" + (v / 1e6).toFixed(1) + "M";
    if (Math.abs(v) >= 1e3) return "$" + (v / 1e3).toFixed(0) + "K";
    return "$" + Math.round(v);
  };
  const fmtDollar = (v) => "$" + Math.round(v).toLocaleString();
  const fmtNum = (v) => Math.round(v).toLocaleString();
  const fmtPct = (v) => (v != null ? v.toFixed(1) + "%" : "—");
  const fmtX = (v) => (v != null ? v.toFixed(2) + "x" : "—");

  // ── Chart Management ──
  let charts = [];
  const destroyCharts = () => {
    charts.forEach((c) => { try { c.destroy(); } catch (e) {} });
    charts = [];
  };
  const mkChart = (id, cfg) => {
    const el = document.getElementById(id);
    if (!el) return null;
    const c = new Chart(el.getContext("2d"), cfg);
    charts.push(c);
    return c;
  };

  // ── Shared Chart Defaults ──
  const baseScaleX = {
    ticks: { color: C.textMuted, font: { size: 9, family: "Inter" }, maxRotation: 45, autoSkip: true, autoSkipPadding: 8 },
    grid: { display: false },
  };
  const baseScaleY = (title, fmt) => ({
    beginAtZero: true,
    title: { display: !!title, text: title || "", color: C.textMuted, font: { size: 10, family: "Inter" } },
    ticks: {
      color: C.textMuted,
      font: { size: 9, family: "Inter" },
      callback: fmt || function (v) { return v >= 1000 ? fmtK(v) : v; },
    },
    grid: { color: C.gridLine },
  });
  const baseTooltip = {
    mode: "index",
    intersect: false,
    backgroundColor: "rgba(15,23,42,0.95)",
    titleColor: "#F1F5F9",
    bodyColor: "#94A3B8",
    borderColor: "rgba(148,163,184,0.2)",
    borderWidth: 1,
    titleFont: { size: 12, weight: "600", family: "Inter" },
    bodyFont: { size: 11, family: "Inter" },
    padding: 10,
    cornerRadius: 8,
  };
  const barRadius = 4;

  // Formatter for datalabels
  const dlFmtK = (v) => {
    if (v === undefined || v === null || v === 0) return "";
    if (Math.abs(v) >= 1e6) return "$" + (v / 1e6).toFixed(1) + "M";
    if (Math.abs(v) >= 1e3) return "$" + (v / 1e3).toFixed(0) + "K";
    return "$" + Math.round(v);
  };
  const dlFmtX = (v) => v ? v.toFixed(2) + "x" : "";
  const dlFmtPct = (v) => v ? v.toFixed(0) + "%" : "";

  // ── Sidebar / Mobile Navigation ──
  let activeDb = "overview";
  let activeSubTab = 0;
  const navItems = document.querySelectorAll(".nav-item");
  const container = $("#dashboardContainer");

  navItems.forEach((btn) => {
    btn.addEventListener("click", () => {
      const raw = btn.dataset.db;
      const db = (raw.startsWith("init") || raw === "overview") ? raw : parseInt(raw);
      navItems.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeDb = db;
      activeSubTab = 0;
      render();
      closeMobileSidebar();
    });
  });

  // Mobile sidebar
  const menuToggle = $("#menuToggle");
  const sidebar = $("#sidebar");
  const overlay = $("#sidebarOverlay");
  const closeMobileSidebar = () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("active");
  };
  if (menuToggle) menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("active");
  });
  if (overlay) overlay.addEventListener("click", closeMobileSidebar);

  // ── Build KPI Row ──
  function kpiRow(items) {
    const n = items.length;
    const cls = n <= 3 ? "cols-3" : n <= 4 ? "cols-4" : n <= 5 ? "cols-5" : "cols-6";
    return `<div class="kpi-row ${cls}">${items.map((k) =>
      `<div class="kpi-card">
        <div class="kpi-label">${k.label}</div>
        <div class="kpi-value">${k.value}</div>
      </div>`
    ).join("")}</div>`;
  }

  function kpiCompareRow(items) {
    return `<div class="kpi-row cols-${items.length}">${items.map((k) =>
      `<div class="kpi-card">
        <div class="kpi-label">${k.label}</div>
        <div class="kpi-compare">
          <div class="kpi-compare-item">
            <div class="kpi-compare-label">Rosen</div>
            <div class="kpi-compare-value rosen">${k.rosen}</div>
          </div>
          <div class="kpi-compare-item">
            <div class="kpi-compare-label">IIBS</div>
            <div class="kpi-compare-value iibs">${k.iibs}</div>
          </div>
        </div>
      </div>`
    ).join("")}</div>`;
  }

  // ── Chart Card HTML ──
  function chartCard(id, title, height) {
    return `<div class="chart-card">
      <div class="chart-card-title">${title}</div>
      <div class="chart-wrap"><canvas id="${id}" height="${height || 400}"></canvas></div>
    </div>`;
  }

  // ── Data Table Builder ──
  function dataTable(title, headers, rows) {
    return `<div class="data-table-card">
      <div class="chart-card-title">${title}</div>
      <div class="data-table-wrap">
        <table class="data-table">
          <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
          <tbody>${rows.map((r) => `<tr>${r.map((c, i) => {
            const cls = c && typeof c === 'object' ? ` class="${c.cls}"` : '';
            const val = c && typeof c === 'object' ? c.v : c;
            return `<td${cls}>${val}</td>`;
          }).join("")}</tr>`).join("")}</tbody>
        </table>
      </div>
    </div>`;
  }

  // ── Sub-tabs ──
  function subTabs(tabNames) {
    return `<div class="sub-tabs">${tabNames.map((t, i) =>
      `<button class="sub-tab${i === activeSubTab ? " active" : ""}" data-subtab="${i}">${t}</button>`
    ).join("")}</div>`;
  }
  function bindSubTabs() {
    document.querySelectorAll(".sub-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeSubTab = parseInt(btn.dataset.subtab);
        render();
      });
    });
  }

  // ── Strategic Headline ──
  function headline(title, subtitle) {
    return `<div class="strategic-headline">${title}</div>
            <div class="strategic-subtitle">${subtitle || ""}</div>`;
  }

  // ===========================================================================
  // DB1 & DB2: School P&L (Rosen / IIBS)
  // ===========================================================================
  function renderSchoolPL(prefix, schoolName) {
    const p = prefix;
    const kpis = [
      { label: "Avg Net Rev Post Churn", value: fmtDollar(avg(col(p + "_net_churn"))) },
      { label: "Avg Net Rev (S-C)", value: fmtDollar(avg(col(p + "_net_sc"))) },
      { label: "Avg mROI", value: fmtX(avg(col(p + "_mroi"))) },
      { label: "Avg Hours", value: fmtNum(avg(col("hours"))) },
      { label: "Avg Rev/Hr", value: "$" + avg(col(p + "_rph")).toFixed(0) },
    ];

    container.innerHTML = `<div class="dashboard-view">
      <div class="db-title">${schoolName} — Consolidated Monthly View</div>
      ${kpiRow(kpis)}
      <div class="chart-grid cols-2">
        ${chartCard("ch1", "Monthly Revenue & Cost Stack", 320)}
        ${chartCard("ch2", "Efficiency & ROI", 280)}
        ${chartCard("ch3", "Acquisition Funnel", 280)}
      </div>
      ${dataTable("Full Monthly Data Table",
        ["Month", "Net Rev PC", "Net Rev SC", "Sales Rev", "Stat Rev", "mROI", "ROAS", "Rev/Hr", "Hours", "Shifts", "Cost", "CPA", "CPL", "Acq", "Conv%", "Leads", "Retries"],
        D.map((d) => [
          d.short, fmtK(d[p+"_net_churn"]), fmtK(d[p+"_net_sc"]), fmtK(d[p+"_sales"]), fmtK(d[p+"_stat_rev"]),
          fmtX(d[p+"_mroi"]), fmtX(d[p+"_roas"]), "$"+Math.round(d[p+"_rph"]), fmtNum(d.hours), fmtNum(d.shifts),
          fmtK(d[p+"_cost"]), fmtDollar(d[p+"_cpa"]), "$"+d[p+"_cpl"].toFixed(1), fmtNum(d[p+"_acq"]),
          fmtPct(d[p+"_conv"]), fmtNum(d[p+"_leads"]), fmtNum(d[p+"_retries"])
        ])
      )}
    </div>`;

    // Chart 1: Revenue & Cost Stack
    mkChart("ch1", {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Sales Rev",
            data: col(p + "_sales"),
            backgroundColor: C.purpleFade,
            borderColor: C.purple,
            borderWidth: 1,
            borderRadius: barRadius,
            datalabels: { anchor: "end", align: "top", color: C.purple, font: { size: 8, weight: "600" }, formatter: dlFmtK },
          },
          {
            label: "Net Rev (S-C)",
            data: col(p + "_net_sc"),
            backgroundColor: C.cyanFade,
            borderColor: C.cyan,
            borderWidth: 1,
            borderRadius: barRadius,
            datalabels: { anchor: "end", align: "top", color: C.cyan, font: { size: 8, weight: "600" }, formatter: dlFmtK },
          },
          {
            label: "Net Rev Post Churn",
            data: col(p + "_net_churn"),
            backgroundColor: C.emeraldFade,
            borderColor: C.emerald,
            borderWidth: 1,
            borderRadius: barRadius,
            datalabels: { anchor: "end", align: "top", color: C.emerald, font: { size: 8, weight: "600" }, formatter: dlFmtK },
          },
          {
            label: "Media Cost",
            data: col(p + "_cost"),
            backgroundColor: C.amberFade,
            borderColor: C.amber,
            borderWidth: 1,
            borderRadius: barRadius,
            datalabels: { anchor: "end", align: "top", color: C.amber, font: { size: 8, weight: "600" }, formatter: dlFmtK },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { labels: { color: C.textSec, font: { size: 10, family: "Inter" }, boxWidth: 12, padding: 12 } },
          tooltip: {
            ...baseTooltip,
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${fmtDollar(ctx.raw)}`,
              afterBody: (items) => {
                const i = items[0].dataIndex;
                const d = D[i];
                return [
                  `  mROI: ${fmtX(d[p+"_mroi"])}  |  ROAS: ${fmtX(d[p+"_roas"])}`,
                  `  Rev/Hr: $${Math.round(d[p+"_rph"])}  |  Hours: ${fmtNum(d.hours)}`,
                ];
              },
            },
          },
        },
        scales: {
          x: baseScaleX,
          y: baseScaleY("Revenue / Cost ($)"),
        },
      },
    });

    // Chart 2: Efficiency & ROI
    mkChart("ch2", {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Hours",
            data: col("hours"),
            backgroundColor: "rgba(148,163,184,0.1)",
            borderColor: "rgba(148,163,184,0.2)",
            borderWidth: 1,
            borderRadius: barRadius,
            yAxisID: "yHours",
            order: 2,
            datalabels: { display: false },
          },
          {
            label: "mROI",
            data: col(p + "_mroi"),
            type: "line",
            borderColor: C.indigo,
            backgroundColor: C.indigoFade,
            pointBackgroundColor: C.indigo,
            pointRadius: 3,
            pointHoverRadius: 6,
            tension: 0.3,
            yAxisID: "yROI",
            order: 1,
            datalabels: { anchor: "end", align: "top", color: C.indigo, font: { size: 8, weight: "600" }, formatter: dlFmtX },
          },
          {
            label: "Rev/Hr",
            data: col(p + "_rph"),
            type: "line",
            borderColor: C.cyan,
            backgroundColor: C.cyanFade,
            pointBackgroundColor: C.cyan,
            pointRadius: 3,
            pointHoverRadius: 6,
            tension: 0.3,
            yAxisID: "yRPH",
            order: 0,
            datalabels: { anchor: "end", align: "bottom", color: C.cyan, font: { size: 8, weight: "600" }, formatter: (v) => "$" + Math.round(v) },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { labels: { color: C.textSec, font: { size: 10, family: "Inter" }, boxWidth: 12, padding: 12 } },
          tooltip: {
            ...baseTooltip,
            callbacks: {
              label: (ctx) => {
                if (ctx.dataset.label === "Hours") return `Hours: ${fmtNum(ctx.raw)}`;
                if (ctx.dataset.label === "mROI") return `mROI: ${fmtX(ctx.raw)}`;
                return `Rev/Hr: $${Math.round(ctx.raw)}`;
              },
            },
          },
        },
        scales: {
          x: baseScaleX,
          yHours: { ...baseScaleY("Hours"), position: "left", grid: { color: C.gridLine } },
          yROI: { position: "right", beginAtZero: true, title: { display: true, text: "mROI", color: C.indigo, font: { size: 10 } }, ticks: { color: C.indigo, font: { size: 9 }, callback: (v) => v.toFixed(1) + "x" }, grid: { display: false } },
          yRPH: { position: "right", beginAtZero: true, display: false },
        },
      },
    });

    // Chart 3: Acquisition Funnel
    mkChart("ch3", {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Leads",
            data: col(p + "_leads"),
            backgroundColor: "rgba(99,102,241,0.12)",
            borderColor: "rgba(99,102,241,0.3)",
            borderWidth: 1,
            borderRadius: barRadius,
            yAxisID: "yLeads",
            order: 2,
            datalabels: { display: false },
          },
          {
            label: "Acquisitions",
            data: col(p + "_acq"),
            backgroundColor: C.indigoFade,
            borderColor: C.indigo,
            borderWidth: 1,
            borderRadius: barRadius,
            barPercentage: 0.5,
            yAxisID: "yLeads",
            order: 2,
            datalabels: { anchor: "end", align: "top", color: C.indigo, font: { size: 8, weight: "600" }, formatter: (v) => fmtNum(v) },
          },
          {
            label: "Conv %",
            data: col(p + "_conv"),
            type: "line",
            borderColor: C.emerald,
            pointBackgroundColor: C.emerald,
            pointRadius: 3,
            pointHoverRadius: 6,
            tension: 0.3,
            yAxisID: "yConv",
            order: 1,
            datalabels: { anchor: "end", align: "top", color: C.emerald, font: { size: 8, weight: "600" }, formatter: (v) => v.toFixed(1) + "%" },
          },
          {
            label: "CPA",
            data: col(p + "_cpa"),
            type: "line",
            borderColor: C.amber,
            pointBackgroundColor: C.amber,
            pointRadius: 3,
            pointHoverRadius: 6,
            tension: 0.3,
            borderDash: [4, 3],
            yAxisID: "yCPA",
            order: 0,
            datalabels: { anchor: "end", align: "bottom", color: C.amber, font: { size: 8, weight: "600" }, formatter: (v) => "$" + Math.round(v) },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { labels: { color: C.textSec, font: { size: 10, family: "Inter" }, boxWidth: 12, padding: 12 } },
          tooltip: {
            ...baseTooltip,
            callbacks: {
              label: (ctx) => {
                const l = ctx.dataset.label;
                if (l === "Leads") return `Leads: ${fmtNum(ctx.raw)}`;
                if (l === "Acquisitions") return `Acquisitions: ${fmtNum(ctx.raw)}`;
                if (l === "Conv %") return `Conversion: ${ctx.raw.toFixed(1)}%`;
                return `CPA: $${Math.round(ctx.raw)}`;
              },
            },
          },
        },
        scales: {
          x: baseScaleX,
          yLeads: { ...baseScaleY("Leads / Acq"), position: "left" },
          yConv: { position: "right", beginAtZero: true, title: { display: true, text: "Conv %", color: C.emerald, font: { size: 10 } }, ticks: { color: C.emerald, font: { size: 9 }, callback: (v) => v + "%" }, grid: { display: false } },
          yCPA: { position: "right", display: false, beginAtZero: true },
        },
      },
    });
  }

  // ===========================================================================
  // DB3: Combined — Both Schools Together
  // ===========================================================================
  function renderCombined() {
    const kpis = [
      { label: "Combined Net Rev (S-C)", value: fmtDollar(avg(col("c_net_sc"))) },
      { label: "Combined Sales Rev", value: fmtDollar(avg(col("c_sales"))) },
      { label: "Combined Cost", value: fmtDollar(avg(col("c_cost"))) },
      { label: "Avg Hours", value: fmtNum(avg(col("hours"))) },
    ];

    container.innerHTML = `<div class="dashboard-view">
      <div class="db-title">Combined — Both Schools Together</div>
      ${kpiRow(kpis)}
      <div class="chart-grid cols-2">
        ${chartCard("ch1", "Revenue by School (Stacked) + Combined Cost", 320)}
        ${chartCard("ch2", "ROI & Efficiency Comparison", 280)}
        ${chartCard("ch3", "Resource Allocation", 280)}
      </div>
      ${dataTable("Combined Summary Table",
        ["Month", "R Net SC", "I Net SC", "Combined SC", "R Sales", "I Sales", "Combined Sales", "R Cost", "I Cost", "Combined Cost", "R mROI", "I mROI", "Hours"],
        D.map((d) => [
          d.short, fmtK(d.r_net_sc), fmtK(d.i_net_sc), fmtK(d.c_net_sc),
          fmtK(d.r_sales), fmtK(d.i_sales), fmtK(d.c_sales),
          fmtK(d.r_cost), fmtK(d.i_cost), fmtK(d.c_cost),
          fmtX(d.r_mroi), fmtX(d.i_mroi), fmtNum(d.hours)
        ])
      )}
    </div>`;

    // Chart 1: Stacked revenue + cost line
    mkChart("ch1", {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Rosen Net Rev SC",
            data: col("r_net_sc"),
            backgroundColor: "rgba(6,182,212,0.5)",
            borderColor: C.cyan,
            borderWidth: 1,
            borderRadius: barRadius,
            stack: "rev",
            order: 2,
            datalabels: { display: false },
          },
          {
            label: "IIBS Net Rev SC",
            data: col("i_net_sc"),
            backgroundColor: "rgba(245,158,11,0.5)",
            borderColor: C.amber,
            borderWidth: 1,
            borderRadius: barRadius,
            stack: "rev",
            order: 2,
            datalabels: {
              anchor: "end", align: "top", color: C.text,
              font: { size: 8, weight: "600" },
              formatter: (v, ctx) => {
                const rVal = D[ctx.dataIndex].r_net_sc;
                return dlFmtK(rVal + v);
              },
            },
          },
          {
            label: "Combined Cost",
            data: col("c_cost"),
            type: "line",
            borderColor: C.red,
            borderDash: [6, 3],
            pointBackgroundColor: C.red,
            pointRadius: 3,
            pointHoverRadius: 6,
            tension: 0.3,
            yAxisID: "y",
            order: 1,
            datalabels: { anchor: "end", align: "bottom", color: C.red, font: { size: 8, weight: "600" }, formatter: dlFmtK },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { labels: { color: C.textSec, font: { size: 10, family: "Inter" }, boxWidth: 12, padding: 12 } },
          tooltip: {
            ...baseTooltip,
            callbacks: {
              afterBody: (items) => {
                const i = items[0].dataIndex;
                const d = D[i];
                return [
                  `  Combined Net SC: ${fmtK(d.c_net_sc)}`,
                  `  R Sales: ${fmtK(d.r_sales)}  |  I Sales: ${fmtK(d.i_sales)}`,
                ];
              },
            },
          },
        },
        scales: {
          x: baseScaleX,
          y: baseScaleY("Revenue / Cost ($)"),
        },
      },
    });

    // Chart 2: ROI comparison
    mkChart("ch2", {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "R mROI",
            data: col("r_mroi"),
            backgroundColor: "rgba(6,182,212,0.35)",
            borderColor: C.cyan,
            borderWidth: 1,
            borderRadius: barRadius,
            yAxisID: "yROI",
            order: 2,
            datalabels: { anchor: "end", align: "top", color: C.cyan, font: { size: 8, weight: "600" }, formatter: dlFmtX },
          },
          {
            label: "I mROI",
            data: col("i_mroi"),
            backgroundColor: "rgba(245,158,11,0.35)",
            borderColor: C.amber,
            borderWidth: 1,
            borderRadius: barRadius,
            yAxisID: "yROI",
            order: 2,
            datalabels: { anchor: "end", align: "top", color: C.amber, font: { size: 8, weight: "600" }, formatter: dlFmtX },
          },
          {
            label: "R ROAS",
            data: col("r_roas"),
            type: "line",
            borderColor: C.cyan,
            borderDash: [5, 3],
            pointRadius: 2,
            tension: 0.3,
            yAxisID: "yROI",
            order: 1,
            datalabels: { display: false },
          },
          {
            label: "I ROAS",
            data: col("i_roas"),
            type: "line",
            borderColor: C.amber,
            borderDash: [5, 3],
            pointRadius: 2,
            tension: 0.3,
            yAxisID: "yROI",
            order: 1,
            datalabels: { display: false },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { labels: { color: C.textSec, font: { size: 10, family: "Inter" }, boxWidth: 12, padding: 12 } },
          tooltip: {
            ...baseTooltip,
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${fmtX(ctx.raw)}`,
            },
          },
        },
        scales: {
          x: baseScaleX,
          yROI: { ...baseScaleY("mROI / ROAS"), ticks: { ...baseScaleY("").ticks, callback: (v) => v.toFixed(1) + "x" } },
        },
      },
    });

    // Chart 3: Resource Allocation
    mkChart("ch3", {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Hours",
            data: col("hours"),
            fill: true,
            backgroundColor: "rgba(148,163,184,0.08)",
            borderColor: "rgba(148,163,184,0.3)",
            pointRadius: 0,
            tension: 0.3,
            yAxisID: "yHours",
            order: 2,
            datalabels: { display: false },
          },
          {
            label: "R Rev/Hr",
            data: col("r_rph"),
            borderColor: C.cyan,
            pointBackgroundColor: C.cyan,
            pointRadius: 3,
            pointHoverRadius: 6,
            tension: 0.3,
            yAxisID: "yRPH",
            order: 1,
            datalabels: { anchor: "end", align: "top", color: C.cyan, font: { size: 8, weight: "600" }, formatter: (v) => "$" + Math.round(v) },
          },
          {
            label: "I Rev/Hr",
            data: col("i_rph"),
            borderColor: C.amber,
            pointBackgroundColor: C.amber,
            pointRadius: 3,
            pointHoverRadius: 6,
            tension: 0.3,
            yAxisID: "yRPH",
            order: 1,
            datalabels: { anchor: "end", align: "bottom", color: C.amber, font: { size: 8, weight: "600" }, formatter: (v) => "$" + Math.round(v) },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { labels: { color: C.textSec, font: { size: 10, family: "Inter" }, boxWidth: 12, padding: 12 } },
          tooltip: {
            ...baseTooltip,
            callbacks: {
              label: (ctx) => {
                if (ctx.dataset.label === "Hours") return `Hours: ${fmtNum(ctx.raw)}`;
                return `${ctx.dataset.label}: $${Math.round(ctx.raw)}`;
              },
            },
          },
        },
        scales: {
          x: baseScaleX,
          yHours: { ...baseScaleY("Hours"), position: "left" },
          yRPH: { position: "right", beginAtZero: true, title: { display: true, text: "Rev/Hr", color: C.textMuted, font: { size: 10 } }, ticks: { color: C.textMuted, font: { size: 9 }, callback: (v) => "$" + v }, grid: { display: false } },
        },
      },
    });
  }

  // ===========================================================================
  // DB4: Zero-Sum — MAJOR REBUILD
  // ===========================================================================
  function renderZeroSum() {
    const avgRTop = avg(col("r_pct_top"));
    const avgITop = avg(col("i_pct_top"));
    const avgOverlap = avg(col("overlap_count"));
    const gaps = D.map((d) => Math.abs(d.r_pct_top - d.i_pct_top));
    const avgGap = avg(gaps);

    // Compute Pearson correlation between r_pct_top and i_pct_top
    const rArr = col("r_pct_top");
    const iArr = col("i_pct_top");
    const n = rArr.length;
    const meanR = avg(rArr);
    const meanI = avg(iArr);
    let num = 0, denR = 0, denI = 0;
    for (let j = 0; j < n; j++) {
      const dr = rArr[j] - meanR, di = iArr[j] - meanI;
      num += dr * di;
      denR += dr * dr;
      denI += di * di;
    }
    const corr = num / (Math.sqrt(denR) * Math.sqrt(denI) || 1);

    // Build rep-level scatter data from REP_DATA
    // Group by rep, aggregate total r_contacted and total r_revenue across all months
    const repNames = ["Tessler Maia", "Getreuer Roy", "Tamir Yakov", "Rubens Fred", "Atkins Kimberly", "Levi Daniela"];
    const repColors = [C.cyan, C.amber, C.emerald, C.indigo, C.purple, C.red];

    // For scatter: use monthly aggregate data — each dot = one month
    // X = r_pct_top, Y = i_pct_top (from aggregate D data) 
    const scatterData = D.map((d) => ({
      x: d.r_pct_top,
      y: d.i_pct_top,
      label: d.short,
    }));

    // For the rep sparklines: for each of the 6 reps, gather monthly r_contacted
    const repMonthlyData = {};
    repNames.forEach((name) => {
      repMonthlyData[name] = D.map((d) => {
        const rec = REP_DATA.find((r) => r.rep === name && r.month === d.month);
        return rec ? rec.r_contacted : 0;
      });
    });

    const kpis = [
      { label: "Avg R % Top Reps", value: fmtPct(avgRTop) },
      { label: "Avg I % Top Reps", value: fmtPct(avgITop) },
      { label: "Correlation R↔I", value: corr.toFixed(3) },
      { label: "Avg Gap |R−I|", value: fmtPct(avgGap) },
    ];

    container.innerHTML = `<div class="dashboard-view">
      ${headline(
        "Should We Separate Sales Reps Across Schools — or Keep Them Combined?",
        "Statistical evidence from 26 months of shared rep data across Rosen &amp; IIBS"
      )}
      ${kpiRow(kpis)}
      <div class="chart-grid cols-2">
        ${chartCard("ch1", "The Bandwidth Trade-Off: R % Top vs I % Top Per Month", 380)}
        ${chartCard("ch2", "Same Rep, Two Schools — The Zero-Sum Proof (R% vs I% Scatter)", 380)}
      </div>
      <div class="chart-grid cols-2">
        ${chartCard("ch3", "Revenue Impact of Bandwidth Allocation", 320)}
        ${chartCard("ch4", "Top 6 Reps — Monthly Contacted Volume (Rosen)", 320)}
      </div>
      ${dataTable("Bandwidth Table",
        ["Month", "Hours", "R % Top", "I % Top", "Gap", "R Net Rev", "I Net Rev", "R mROI", "I mROI", "Overlap", "Shared Reps"],
        D.map((d) => [
          d.short, fmtNum(d.hours),
          fmtPct(d.r_pct_top), fmtPct(d.i_pct_top), fmtPct(Math.abs(d.r_pct_top - d.i_pct_top)),
          fmtK(d.r_net_sc), fmtK(d.i_net_sc), fmtX(d.r_mroi), fmtX(d.i_mroi),
          d.overlap_count, { v: (d.overlap_names || []).join(", "), cls: "rep-names" }
        ])
      )}
    </div>`;

    // Chart 1: The Bandwidth Trade-Off — grouped bars with % labels
    mkChart("ch1", {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "R % Top Reps",
            data: col("r_pct_top"),
            backgroundColor: "rgba(6,182,212,0.5)",
            borderColor: C.cyan,
            borderWidth: 1,
            borderRadius: barRadius,
            yAxisID: "yPct",
            order: 2,
            datalabels: { anchor: "end", align: "top", color: C.cyan, font: { size: 9, weight: "700" }, formatter: (v) => Math.round(v) + "%" },
          },
          {
            label: "I % Top Reps",
            data: col("i_pct_top"),
            backgroundColor: "rgba(245,158,11,0.5)",
            borderColor: C.amber,
            borderWidth: 1,
            borderRadius: barRadius,
            yAxisID: "yPct",
            order: 2,
            datalabels: { anchor: "end", align: "top", color: C.amber, font: { size: 9, weight: "700" }, formatter: (v) => Math.round(v) + "%" },
          },
          {
            label: "Overlap Count",
            data: col("overlap_count"),
            type: "line",
            borderColor: C.textSec,
            pointBackgroundColor: C.textSec,
            pointRadius: 3,
            pointHoverRadius: 6,
            tension: 0.3,
            yAxisID: "yOverlap",
            order: 1,
            datalabels: { anchor: "end", align: "top", color: C.textSec, font: { size: 8 }, formatter: (v) => v > 0 ? v : "" },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { labels: { color: C.textSec, font: { size: 10, family: "Inter" }, boxWidth: 12, padding: 12 } },
          tooltip: {
            ...baseTooltip,
            callbacks: {
              afterBody: (items) => {
                const i = items[0].dataIndex;
                const d = D[i];
                return [
                  `  Gap: ${fmtPct(Math.abs(d.r_pct_top - d.i_pct_top))}`,
                  `  R Reps: ${(d.r_top_names||[]).join(", ")}`,
                  `  I Reps: ${(d.i_top_names||[]).join(", ")}`,
                  `  Shared: ${(d.overlap_names||[]).join(", ") || "None"}`,
                ];
              },
            },
          },
        },
        scales: {
          x: baseScaleX,
          yPct: { ...baseScaleY("% Top Reps"), max: 100, ticks: { ...baseScaleY("").ticks, callback: (v) => v + "%" } },
          yOverlap: { position: "right", beginAtZero: true, title: { display: true, text: "Overlap", color: C.textMuted, font: { size: 10 } }, ticks: { color: C.textMuted, font: { size: 9 }, stepSize: 1 }, grid: { display: false } },
        },
      },
    });

    // Chart 2: Scatter — R % Top vs I % Top (each dot = one month)
    mkChart("ch2", {
      type: "scatter",
      data: {
        datasets: [{
          label: "Month (R% vs I%)",
          data: scatterData,
          backgroundColor: "rgba(6,182,212,0.6)",
          borderColor: C.cyan,
          pointRadius: 7,
          pointHoverRadius: 10,
          datalabels: {
            display: true,
            color: C.textSec,
            font: { size: 8, family: "Inter" },
            align: "top",
            offset: 4,
            formatter: (v) => v.label,
          },
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "nearest", intersect: true },
        plugins: {
          legend: { labels: { color: C.textSec, font: { size: 10, family: "Inter" }, boxWidth: 12, padding: 12 } },
          tooltip: {
            ...baseTooltip,
            callbacks: {
              label: (ctx) => {
                const pt = ctx.raw;
                return `${pt.label}: R ${pt.x.toFixed(1)}% → I ${pt.y.toFixed(1)}%`;
              },
            },
          },
          annotation: {
            annotations: {
              trendLine: {
                type: "label",
                content: [`Pearson r = ${corr.toFixed(3)}`, corr < -0.15 ? "NEGATIVE correlation confirms zero-sum" : corr > 0.15 ? "Positive correlation" : "Weak correlation"],
                position: { x: "start", y: "start" },
                xValue: Math.max(...rArr) - 5,
                yValue: Math.max(...iArr) - 5,
                backgroundColor: "rgba(15,23,42,0.9)",
                color: corr < -0.15 ? C.emerald : C.amber,
                font: { size: 11, weight: "600" },
                padding: 8,
              },
            },
          },
        },
        scales: {
          x: { ...baseScaleX, title: { display: true, text: "R % Top Reps →", color: C.cyan, font: { size: 11, weight: "600" } }, ticks: { ...baseScaleX.ticks, callback: (v) => v + "%" }, grid: { color: C.gridLine }, min: 0 },
          y: { ...baseScaleY("I % Top Reps →"), ticks: { ...baseScaleY("").ticks, callback: (v) => v + "%" }, min: 0 },
        },
      },
    });

    // Chart 3: Revenue Impact of Bandwidth Allocation
    mkChart("ch3", {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "R Net Rev SC",
            data: col("r_net_sc"),
            backgroundColor: "rgba(6,182,212,0.4)",
            borderColor: C.cyan,
            borderWidth: 1,
            borderRadius: barRadius,
            yAxisID: "yRev",
            order: 2,
            datalabels: { display: false },
          },
          {
            label: "I Net Rev SC",
            data: col("i_net_sc"),
            backgroundColor: "rgba(245,158,11,0.4)",
            borderColor: C.amber,
            borderWidth: 1,
            borderRadius: barRadius,
            yAxisID: "yRev",
            order: 2,
            datalabels: { display: false },
          },
          {
            label: "R % Top",
            data: col("r_pct_top"),
            type: "line",
            borderColor: C.cyan,
            borderDash: [5, 3],
            pointBackgroundColor: C.cyan,
            pointRadius: 3,
            pointHoverRadius: 6,
            tension: 0.3,
            yAxisID: "yPct",
            order: 1,
            datalabels: { anchor: "end", align: "top", color: C.cyan, font: { size: 8 }, formatter: (v) => Math.round(v) + "%" },
          },
          {
            label: "I % Top",
            data: col("i_pct_top"),
            type: "line",
            borderColor: C.amber,
            borderDash: [5, 3],
            pointBackgroundColor: C.amber,
            pointRadius: 3,
            pointHoverRadius: 6,
            tension: 0.3,
            yAxisID: "yPct",
            order: 1,
            datalabels: { anchor: "end", align: "bottom", color: C.amber, font: { size: 8 }, formatter: (v) => Math.round(v) + "%" },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { labels: { color: C.textSec, font: { size: 10, family: "Inter" }, boxWidth: 12, padding: 12 } },
          tooltip: {
            ...baseTooltip,
            callbacks: {
              afterBody: (items) => {
                const i = items[0].dataIndex;
                const d = D[i];
                return [`  R mROI: ${fmtX(d.r_mroi)}  |  I mROI: ${fmtX(d.i_mroi)}`];
              },
            },
          },
        },
        scales: {
          x: baseScaleX,
          yRev: { ...baseScaleY("Net Revenue ($)"), position: "left" },
          yPct: { position: "right", beginAtZero: true, max: 100, title: { display: true, text: "% Top Reps", color: C.textMuted, font: { size: 10 } }, ticks: { color: C.textMuted, font: { size: 9 }, callback: (v) => v + "%" }, grid: { display: false } },
        },
      },
    });

    // Chart 4: Top 6 Reps — Monthly Contacted Volume sparklines
    const repDatasets = repNames.map((name, idx) => ({
      label: name.split(" ")[0],
      data: repMonthlyData[name],
      borderColor: repColors[idx],
      backgroundColor: repColors[idx],
      pointRadius: 2,
      pointHoverRadius: 5,
      tension: 0.3,
      borderWidth: 2,
      datalabels: { display: false },
    }));

    mkChart("ch4", {
      type: "line",
      data: { labels, datasets: repDatasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { labels: { color: C.textSec, font: { size: 10, family: "Inter" }, boxWidth: 12, padding: 12 } },
          tooltip: {
            ...baseTooltip,
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${fmtNum(ctx.raw)} contacted`,
            },
          },
        },
        scales: {
          x: baseScaleX,
          y: baseScaleY("Contacted"),
        },
      },
    });
  }

  // ===========================================================================
  // DB5: Fair Context
  // ===========================================================================
  function renderFairContextForPrefix(p) {
    const schoolName = p === "r" ? "Rosen" : "IIBS";
    const kpis = [
      { label: "Avg Hours", value: fmtNum(avg(col("hours"))) },
      { label: "Avg Shifts", value: fmtNum(avg(col("shifts"))) },
      { label: "Avg % Top Reps", value: fmtPct(avg(col(p + "_pct_top"))) },
      { label: "Avg Leads", value: fmtNum(avg(col(p + "_leads"))) },
      { label: "Avg Net Rev SC", value: fmtDollar(avg(col(p + "_net_sc"))) },
    ];

    container.innerHTML = `<div class="dashboard-view">
      ${headline(
        "Do Rep Hours Directly Drive Revenue?",
        "Examining the relationship between resource inputs and revenue outputs for " + schoolName
      )}
      ${subTabs(["Rosen", "IIBS"])}
      ${kpiRow(kpis)}
      <div class="chart-grid cols-2">
        ${chartCard("ch1", "Resources Given → Results Produced", 320)}
        ${chartCard("ch2", "Rep Quality → Revenue", 280)}
        ${chartCard("ch3", "Input Metrics Trend", 280)}
      </div>
      ${dataTable("Input-Output Table",
        ["Month", "Hours", "Shifts", "Leads", "Retries", "% Top", "→", "Net Rev PC", "Net Rev SC", "Sales Rev", "mROI", "ROAS", "Rev/Hr"],
        D.map((d) => [
          d.short, fmtNum(d.hours), fmtNum(d.shifts), fmtNum(d[p+"_leads"]), fmtNum(d[p+"_retries"]),
          fmtPct(d[p+"_pct_top"]), "→",
          fmtK(d[p+"_net_churn"]), fmtK(d[p+"_net_sc"]), fmtK(d[p+"_sales"]),
          fmtX(d[p+"_mroi"]), fmtX(d[p+"_roas"]), "$"+Math.round(d[p+"_rph"])
        ])
      )}
    </div>`;
    bindSubTabs();

    // Chart 1: Resources → Results
    mkChart("ch1", {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Hours",
            data: col("hours"),
            backgroundColor: "rgba(148,163,184,0.1)",
            borderColor: "rgba(148,163,184,0.2)",
            borderWidth: 1,
            borderRadius: barRadius,
            yAxisID: "yHours",
            order: 2,
            datalabels: { display: false },
          },
          {
            label: "Net Rev Post Churn",
            data: col(p + "_net_churn"),
            type: "line",
            borderColor: C.emerald,
            pointBackgroundColor: C.emerald,
            pointRadius: 3,
            pointHoverRadius: 6,
            tension: 0.3,
            yAxisID: "yRev",
            order: 1,
            datalabels: { anchor: "end", align: "top", color: C.emerald, font: { size: 8, weight: "600" }, formatter: dlFmtK },
          },
          {
            label: "Net Rev (S-C)",
            data: col(p + "_net_sc"),
            type: "line",
            borderColor: C.cyan,
            pointBackgroundColor: C.cyan,
            pointRadius: 3,
            pointHoverRadius: 6,
            tension: 0.3,
            yAxisID: "yRev",
            order: 1,
            datalabels: { anchor: "end", align: "bottom", color: C.cyan, font: { size: 8, weight: "600" }, formatter: dlFmtK },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { labels: { color: C.textSec, font: { size: 10, family: "Inter" }, boxWidth: 12, padding: 12 } },
          tooltip: {
            ...baseTooltip,
            callbacks: {
              afterBody: (items) => {
                const i = items[0].dataIndex;
                const d = D[i];
                return [
                  `  Shifts: ${d.shifts}  |  % Top: ${fmtPct(d[p+"_pct_top"])}`,
                  `  mROI: ${fmtX(d[p+"_mroi"])}  |  Rank Hours: #${d.rk_hours}`,
                ];
              },
            },
          },
        },
        scales: {
          x: baseScaleX,
          yHours: { ...baseScaleY("Hours"), position: "left" },
          yRev: { position: "right", beginAtZero: true, title: { display: true, text: "Revenue ($)", color: C.textMuted, font: { size: 10 } }, ticks: { color: C.textMuted, font: { size: 9 }, callback: (v) => fmtK(v) }, grid: { display: false } },
        },
      },
    });

    // Chart 2: Rep Quality → Revenue
    mkChart("ch2", {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "% Top Reps",
            data: col(p + "_pct_top"),
            backgroundColor: "rgba(6,182,212,0.35)",
            borderColor: C.cyan,
            borderWidth: 1,
            borderRadius: barRadius,
            yAxisID: "yPct",
            order: 2,
            datalabels: { anchor: "end", align: "top", color: C.cyan, font: { size: 8, weight: "600" }, formatter: (v) => Math.round(v) + "%" },
          },
          {
            label: "Net Rev (S-C)",
            data: col(p + "_net_sc"),
            type: "line",
            borderColor: C.emerald,
            pointBackgroundColor: C.emerald,
            pointRadius: 3,
            pointHoverRadius: 6,
            tension: 0.3,
            yAxisID: "yRev",
            order: 1,
            datalabels: { anchor: "end", align: "top", color: C.emerald, font: { size: 8, weight: "600" }, formatter: dlFmtK },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { labels: { color: C.textSec, font: { size: 10, family: "Inter" }, boxWidth: 12, padding: 12 } },
          tooltip: { ...baseTooltip },
        },
        scales: {
          x: baseScaleX,
          yPct: { ...baseScaleY("% Top Reps"), position: "left", max: 100, ticks: { ...baseScaleY("").ticks, callback: (v) => v + "%" } },
          yRev: { position: "right", beginAtZero: true, title: { display: true, text: "Net Rev SC ($)", color: C.emerald, font: { size: 10 } }, ticks: { color: C.emerald, font: { size: 9 }, callback: (v) => fmtK(v) }, grid: { display: false } },
        },
      },
    });

    // Chart 3: Input Metrics Trend
    mkChart("ch3", {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Hours",
            data: col("hours"),
            borderColor: "#60A5FA",
            pointRadius: 2,
            tension: 0.3,
            yAxisID: "yHours",
            datalabels: { display: false },
          },
          {
            label: "Shifts",
            data: col("shifts"),
            borderColor: C.purple,
            pointRadius: 2,
            tension: 0.3,
            yAxisID: "yHours",
            datalabels: { display: false },
          },
          {
            label: "Leads",
            data: col(p + "_leads"),
            borderColor: C.amber,
            pointRadius: 2,
            tension: 0.3,
            yAxisID: "yLeads",
            datalabels: { display: false },
          },
          {
            label: "Retries",
            data: col(p + "_retries"),
            borderColor: C.textMuted,
            borderDash: [4, 3],
            pointRadius: 2,
            tension: 0.3,
            yAxisID: "yLeads",
            datalabels: { display: false },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { labels: { color: C.textSec, font: { size: 10, family: "Inter" }, boxWidth: 12, padding: 12 } },
          tooltip: {
            ...baseTooltip,
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${fmtNum(ctx.raw)}`,
            },
          },
        },
        scales: {
          x: baseScaleX,
          yHours: { ...baseScaleY("Hours / Shifts"), position: "left" },
          yLeads: { position: "right", beginAtZero: true, title: { display: true, text: "Leads / Retries", color: C.textMuted, font: { size: 10 } }, ticks: { color: C.textMuted, font: { size: 9 } }, grid: { display: false } },
        },
      },
    });
  }

  // ===========================================================================
  // DB6: CEO Strategic Overview
  // ===========================================================================
  function renderCEOOverview() {
    const kpis = [
      { label: "Net Rev Post Churn", rosen: fmtDollar(avg(col("r_net_churn"))), iibs: fmtDollar(avg(col("i_net_churn"))) },
      { label: "Net Rev (S-C)", rosen: fmtDollar(avg(col("r_net_sc"))), iibs: fmtDollar(avg(col("i_net_sc"))) },
      { label: "mROI", rosen: fmtX(avg(col("r_mroi"))), iibs: fmtX(avg(col("i_mroi"))) },
      { label: "ROAS", rosen: fmtX(avg(col("r_roas"))), iibs: fmtX(avg(col("i_roas"))) },
      { label: "Rev/Hr", rosen: "$" + avg(col("r_rph")).toFixed(0), iibs: "$" + avg(col("i_rph")).toFixed(0) },
      { label: "Sales Rev", rosen: fmtDollar(avg(col("r_sales"))), iibs: fmtDollar(avg(col("i_sales"))) },
    ];

    container.innerHTML = `<div class="dashboard-view">
      <div class="db-title">CEO Strategic Overview</div>
      ${kpiCompareRow(kpis)}
      <div class="chart-grid cols-2">
        ${chartCard("ch1", "Net Revenue Comparison", 280)}
        ${chartCard("ch2", "ROI Comparison", 260)}
        ${chartCard("ch3", "Sales Revenue & Cost", 260)}
        ${chartCard("ch4", "Efficiency — Rev/Hr", 260)}
      </div>
    </div>`;

    // Chart 1
    mkChart("ch1", {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "R Net Rev SC",
            data: col("r_net_sc"),
            fill: true,
            backgroundColor: "rgba(6,182,212,0.15)",
            borderColor: C.cyan,
            pointRadius: 2,
            pointHoverRadius: 5,
            tension: 0.3,
            datalabels: { display: false },
          },
          {
            label: "I Net Rev SC",
            data: col("i_net_sc"),
            fill: true,
            backgroundColor: "rgba(245,158,11,0.15)",
            borderColor: C.amber,
            pointRadius: 2,
            pointHoverRadius: 5,
            tension: 0.3,
            datalabels: { display: false },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { labels: { color: C.textSec, font: { size: 10, family: "Inter" }, boxWidth: 12, padding: 12 } },
          tooltip: {
            ...baseTooltip,
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${fmtDollar(ctx.raw)}`,
              afterBody: (items) => {
                const i = items[0].dataIndex;
                const d = D[i];
                return [`  Gap: ${fmtDollar(d.i_net_sc - d.r_net_sc)}`];
              },
            },
          },
        },
        scales: { x: baseScaleX, y: baseScaleY("Net Revenue SC ($)") },
      },
    });

    // Chart 2
    mkChart("ch2", {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "R mROI",
            data: col("r_mroi"),
            borderColor: C.cyan,
            pointBackgroundColor: C.cyan,
            pointRadius: 3,
            pointHoverRadius: 6,
            tension: 0.3,
            datalabels: { anchor: "end", align: "top", color: C.cyan, font: { size: 8, weight: "600" }, formatter: dlFmtX },
          },
          {
            label: "I mROI",
            data: col("i_mroi"),
            borderColor: C.amber,
            pointBackgroundColor: C.amber,
            pointRadius: 3,
            pointHoverRadius: 6,
            tension: 0.3,
            datalabels: { anchor: "end", align: "bottom", color: C.amber, font: { size: 8, weight: "600" }, formatter: dlFmtX },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { labels: { color: C.textSec, font: { size: 10, family: "Inter" }, boxWidth: 12, padding: 12 } },
          tooltip: { ...baseTooltip, callbacks: { label: (ctx) => `${ctx.dataset.label}: ${fmtX(ctx.raw)}` } },
        },
        scales: {
          x: baseScaleX,
          y: { ...baseScaleY("mROI"), ticks: { ...baseScaleY("").ticks, callback: (v) => v.toFixed(1) + "x" } },
        },
      },
    });

    // Chart 3
    mkChart("ch3", {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "R Sales", data: col("r_sales"), borderColor: C.cyan, pointRadius: 2, tension: 0.3, datalabels: { display: false } },
          { label: "I Sales", data: col("i_sales"), borderColor: C.amber, pointRadius: 2, tension: 0.3, datalabels: { display: false } },
          { label: "R Cost", data: col("r_cost"), borderColor: C.cyan, borderDash: [5, 3], pointRadius: 2, tension: 0.3, datalabels: { display: false } },
          { label: "I Cost", data: col("i_cost"), borderColor: C.amber, borderDash: [5, 3], pointRadius: 2, tension: 0.3, datalabels: { display: false } },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { labels: { color: C.textSec, font: { size: 10, family: "Inter" }, boxWidth: 12, padding: 12 } },
          tooltip: { ...baseTooltip, callbacks: { label: (ctx) => `${ctx.dataset.label}: ${fmtDollar(ctx.raw)}` } },
        },
        scales: { x: baseScaleX, y: baseScaleY("Amount ($)") },
      },
    });

    // Chart 4
    mkChart("ch4", {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Hours",
            data: col("hours"),
            backgroundColor: "rgba(148,163,184,0.1)",
            borderColor: "rgba(148,163,184,0.2)",
            borderWidth: 1,
            borderRadius: barRadius,
            yAxisID: "yHours",
            order: 2,
            datalabels: { display: false },
          },
          {
            label: "R Rev/Hr",
            data: col("r_rph"),
            type: "line",
            borderColor: C.cyan,
            pointBackgroundColor: C.cyan,
            pointRadius: 3,
            pointHoverRadius: 6,
            tension: 0.3,
            yAxisID: "yRPH",
            order: 1,
            datalabels: { anchor: "end", align: "top", color: C.cyan, font: { size: 8, weight: "600" }, formatter: (v) => "$" + Math.round(v) },
          },
          {
            label: "I Rev/Hr",
            data: col("i_rph"),
            type: "line",
            borderColor: C.amber,
            pointBackgroundColor: C.amber,
            pointRadius: 3,
            pointHoverRadius: 6,
            tension: 0.3,
            yAxisID: "yRPH",
            order: 1,
            datalabels: { anchor: "end", align: "bottom", color: C.amber, font: { size: 8, weight: "600" }, formatter: (v) => "$" + Math.round(v) },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { labels: { color: C.textSec, font: { size: 10, family: "Inter" }, boxWidth: 12, padding: 12 } },
          tooltip: { ...baseTooltip },
        },
        scales: {
          x: baseScaleX,
          yHours: { ...baseScaleY("Hours"), position: "left" },
          yRPH: { position: "right", beginAtZero: true, title: { display: true, text: "Rev/Hr", color: C.textMuted, font: { size: 10 } }, ticks: { color: C.textMuted, font: { size: 9 }, callback: (v) => "$" + v }, grid: { display: false } },
        },
      },
    });
  }

  // ===========================================================================
  // DB7: Top Reps — MAJOR REBUILD
  // ===========================================================================
  function renderTopReps() {
    const sub = activeSubTab === 0 ? "r" : "i";
    const schoolName = sub === "r" ? "Rosen" : "IIBS";
    const topData = col(sub + "_pct_top");
    const revData = col(sub + "_net_sc");

    // Find golden threshold — test 55, 60, 65, 70, 75
    const thresholds = [55, 60, 65, 70, 75];
    let bestThreshold = 65;
    let bestSeparation = 0;
    thresholds.forEach((th) => {
      const above = D.filter((d) => d[sub + "_pct_top"] >= th);
      const below = D.filter((d) => d[sub + "_pct_top"] < th);
      if (above.length < 3 || below.length < 3) return;
      const avgAbove = avg(above.map((d) => d[sub + "_net_sc"]));
      const avgBelow = avg(below.map((d) => d[sub + "_net_sc"]));
      const separation = (avgAbove - avgBelow) / (avgBelow || 1);
      if (separation > bestSeparation) {
        bestSeparation = separation;
        bestThreshold = th;
      }
    });

    const threshold = bestThreshold;
    const highMonths = D.filter((d) => d[sub + "_pct_top"] >= threshold);
    const lowMonths = D.filter((d) => d[sub + "_pct_top"] < threshold);
    const avgRevHigh = highMonths.length ? avg(highMonths.map((d) => d[sub + "_net_sc"])) : 0;
    const avgRevLow = lowMonths.length ? avg(lowMonths.map((d) => d[sub + "_net_sc"])) : 0;

    // Rep-level data
    const repNames6 = ["Tessler Maia", "Getreuer Roy", "Tamir Yakov", "Rubens Fred", "Atkins Kimberly", "Levi Daniela"];
    const repColors6 = [C.cyan, C.amber, C.emerald, C.indigo, C.purple, C.red];

    // Compute each rep's acq/contacted % per month
    const repMonthlyPct = {};
    repNames6.forEach((name) => {
      repMonthlyPct[name] = D.map((d) => {
        const rec = REP_DATA.find((r) => r.rep === name && r.month === d.month);
        if (!rec || rec.r_contacted === 0) return null;
        return (rec.r_acq / rec.r_contacted * 100);
      });
    });

    // Compute each rep's average pct (non-null months only)
    const repAvgPct = {};
    repNames6.forEach((name) => {
      const vals = repMonthlyPct[name].filter((v) => v !== null);
      repAvgPct[name] = vals.length ? avg(vals) : 0;
    });

    // Rep monthly revenue
    const repMonthlyRev = {};
    repNames6.forEach((name) => {
      repMonthlyRev[name] = D.map((d) => {
        const rec = REP_DATA.find((r) => r.rep === name && r.month === d.month);
        return rec ? rec.r_revenue : 0;
      });
    });

    const kpis = [
      { label: "Golden Threshold", value: threshold + "%" },
      { label: "Months Above", value: highMonths.length + " / " + D.length },
      { label: "Avg Rev (ABOVE)", value: fmtDollar(avgRevHigh) },
      { label: "Avg Rev (BELOW)", value: fmtDollar(avgRevLow) },
      { label: "Delta", value: "+" + Math.round((bestSeparation) * 100) + "%" },
    ];

    container.innerHTML = `<div class="dashboard-view">
      ${headline(
        "What's the Golden % of Contacted to Never Fall Below?",
        "Analyzing consistent top performers across 26 months"
      )}
      ${subTabs(["Rosen", "IIBS"])}
      ${kpiRow(kpis)}
      <div class="chart-grid cols-2">
        ${chartCard("ch1", "The Golden Threshold — % Top Reps vs Net Revenue", 380)}
        ${chartCard("ch2", "Rockstar Consistency — Acq/Contacted % Per Month", 380)}
      </div>
      ${dataTable("Rep Names & Monthly Performance Table",
        ["Month", "% Top Reps", "Top Rep Names", "Net Rev PC", "Net Rev (S-C)", "Sales Rev", "mROI", "Acq", "Reg", "Hours"],
        D.map((d) => [
          d.short,
          { v: fmtPct(d[sub+"_pct_top"]), cls: "neon-pct" },
          { v: (d[sub+"_top_names"]||[]).join(", "), cls: "rep-name-large" },
          fmtK(d[sub+"_net_churn"]), fmtK(d[sub+"_net_sc"]), fmtK(d[sub+"_sales"]),
          fmtX(d[sub+"_mroi"]), fmtNum(d[sub+"_acq"]), fmtNum(d[sub+"_reg"]), fmtNum(d.hours)
        ])
      )}
      <div class="chart-grid cols-2" style="margin-top:16px;">
        ${chartCard("ch3", "Rockstar Dual-School Revenue — Top 6 Reps (Monthly)", 380)}
      </div>
    </div>`;
    bindSubTabs();

    // Chart 1: The Golden Threshold
    const barColors = D.map((d) => d[sub + "_pct_top"] >= threshold ? "rgba(16,185,129,0.55)" : "rgba(239,68,68,0.45)");
    const barBorders = D.map((d) => d[sub + "_pct_top"] >= threshold ? C.emerald : C.red);

    mkChart("ch1", {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "% Top Reps",
            data: topData,
            backgroundColor: barColors,
            borderColor: barBorders,
            borderWidth: 1,
            borderRadius: barRadius,
            yAxisID: "yPct",
            order: 2,
            datalabels: { anchor: "end", align: "top", color: barBorders, font: { size: 9, weight: "700" }, formatter: (v) => Math.round(v) + "%" },
          },
          {
            label: "Net Rev (S-C)",
            data: revData,
            type: "line",
            borderColor: C.cyan,
            pointBackgroundColor: C.cyan,
            pointRadius: 4,
            pointHoverRadius: 7,
            tension: 0.3,
            yAxisID: "yRev",
            order: 1,
            datalabels: { anchor: "end", align: "bottom", color: C.cyan, font: { size: 8, weight: "600" }, formatter: dlFmtK },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            labels: {
              color: C.textSec,
              font: { size: 10, family: "Inter" },
              boxWidth: 12,
              padding: 12,
              generateLabels: () => [
                { text: `Above ${threshold}% (good months)`, fillStyle: "rgba(16,185,129,0.55)", strokeStyle: C.emerald, lineWidth: 1 },
                { text: `Below ${threshold}% (weak months)`, fillStyle: "rgba(239,68,68,0.45)", strokeStyle: C.red, lineWidth: 1 },
                { text: "Net Rev (S-C)", fillStyle: "transparent", strokeStyle: C.cyan, lineWidth: 2 },
              ],
            },
          },
          tooltip: {
            ...baseTooltip,
            callbacks: {
              afterBody: (items) => {
                const i = items[0].dataIndex;
                const d = D[i];
                const above = d[sub+"_pct_top"] >= threshold ? "ABOVE" : "BELOW";
                return [
                  `  Engagement: ${above} threshold (${threshold}%)`,
                  `  mROI: ${fmtX(d[sub+"_mroi"])}  |  Rev/Hr: $${Math.round(d[sub+"_rph"])}`,
                  `  Top Reps: ${(d[sub+"_top_names"]||[]).join(", ")}`,
                ];
              },
            },
          },
          annotation: {
            annotations: {
              thresholdLine: {
                type: "line",
                yMin: threshold,
                yMax: threshold,
                yScaleID: "yPct",
                borderColor: "rgba(255,255,255,0.5)",
                borderDash: [8, 4],
                borderWidth: 2,
                label: {
                  display: true,
                  content: `Golden Threshold: ${threshold}%`,
                  position: "start",
                  backgroundColor: "rgba(255,255,255,0.15)",
                  color: "#fff",
                  font: { size: 11, weight: "700" },
                  padding: 6,
                },
              },
            },
          },
        },
        scales: {
          x: baseScaleX,
          yPct: { ...baseScaleY("% Top Reps"), position: "left", max: 100, ticks: { ...baseScaleY("").ticks, callback: (v) => v + "%" } },
          yRev: { position: "right", beginAtZero: true, title: { display: true, text: "Net Rev SC ($)", color: C.cyan, font: { size: 10 } }, ticks: { color: C.cyan, font: { size: 9 }, callback: (v) => fmtK(v) }, grid: { display: false } },
        },
      },
    });

    // Chart 2: Rockstar Consistency heatmap-style grouped bars
    const consistencyDatasets = repNames6.map((name, idx) => ({
      label: name,
      data: repMonthlyPct[name].map((v) => v !== null ? v : 0),
      backgroundColor: repMonthlyPct[name].map((v) => {
        if (v === null || v === 0) return "rgba(100,116,139,0.1)";
        const repAvg = repAvgPct[name];
        if (v < repAvg * 0.7) return "rgba(239,68,68,0.6)"; // slacked
        return repColors6[idx] + "99";
      }),
      borderColor: repColors6[idx],
      borderWidth: 1,
      borderRadius: 2,
      datalabels: { display: false },
    }));

    mkChart("ch2", {
      type: "bar",
      data: { labels, datasets: consistencyDatasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { labels: { color: C.textSec, font: { size: 10, family: "Inter" }, boxWidth: 12, padding: 12 } },
          tooltip: {
            ...baseTooltip,
            callbacks: {
              label: (ctx) => {
                const v = ctx.raw;
                const name = repNames6[ctx.datasetIndex];
                if (!v) return `${name}: inactive`;
                return `${name}: ${v.toFixed(1)}% acq/contacted (avg: ${repAvgPct[name].toFixed(1)}%)`;
              },
            },
          },
        },
        scales: {
          x: baseScaleX,
          y: { ...baseScaleY("Acq / Contacted %"), ticks: { ...baseScaleY("").ticks, callback: (v) => v + "%" } },
        },
      },
    });

    // Chart 3: Rockstar Dual-School Revenue — small multiples via grouped line chart
    const revDatasets = repNames6.map((name, idx) => ({
      label: name,
      data: repMonthlyRev[name],
      borderColor: repColors6[idx],
      backgroundColor: repColors6[idx],
      pointRadius: 2,
      pointHoverRadius: 5,
      tension: 0.3,
      borderWidth: 2,
      datalabels: { display: false },
    }));

    mkChart("ch3", {
      type: "line",
      data: { labels, datasets: revDatasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { labels: { color: C.textSec, font: { size: 10, family: "Inter" }, boxWidth: 12, padding: 12 } },
          tooltip: {
            ...baseTooltip,
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${fmtDollar(ctx.raw)}`,
            },
          },
        },
        scales: {
          x: baseScaleX,
          y: baseScaleY("Revenue ($)"),
        },
      },
    });
  }

  // ===========================================================================
  // DB8: Monthly Intelligence Briefing
  // ===========================================================================
  function renderMonthlyIntel() {
    const subNames = ["Rosen", "IIBS", "Combined"];
    const sub = activeSubTab;
    let prefix, schoolName;
    if (sub === 0) { prefix = "r"; schoolName = "Rosen"; }
    else if (sub === 1) { prefix = "i"; schoolName = "IIBS"; }
    else { prefix = null; schoolName = "Combined"; }

    let revField;
    if (prefix) {
      revField = prefix + "_net_churn";
    } else {
      revField = "c_net_sc";
    }
    const revArr = col(revField);
    const bestIdx = revArr.indexOf(Math.max(...revArr));
    const worstIdx = revArr.indexOf(Math.min(...revArr));
    const avgRev = avg(revArr);
    const trend = revArr[revArr.length - 1] > revArr[revArr.length - 4] ? "↑ Up" : "↓ Down";

    const kpis = [
      { label: "Best Month", value: D[bestIdx].short + " (" + fmtK(revArr[bestIdx]) + ")" },
      { label: "Worst Month", value: D[worstIdx].short + " (" + fmtK(revArr[worstIdx]) + ")" },
      { label: "Average Revenue", value: fmtDollar(avgRev) },
      { label: "Trend (3mo)", value: trend },
    ];

    let tableHeaders, tableRows;
    if (prefix) {
      tableHeaders = ["Month", "Net Rev PC", "Net Rev SC", "Sales Rev", "Stat Rev", "mROI", "ROAS", "Rev/Hr", "Hours", "Cost", "CPA", "Acq", "Leads"];
      tableRows = D.map((d) => [
        d.short, fmtK(d[prefix+"_net_churn"]), fmtK(d[prefix+"_net_sc"]), fmtK(d[prefix+"_sales"]),
        fmtK(d[prefix+"_stat_rev"]), fmtX(d[prefix+"_mroi"]), fmtX(d[prefix+"_roas"]),
        "$"+Math.round(d[prefix+"_rph"]), fmtNum(d.hours), fmtK(d[prefix+"_cost"]),
        fmtDollar(d[prefix+"_cpa"]), fmtNum(d[prefix+"_acq"]), fmtNum(d[prefix+"_leads"])
      ]);
    } else {
      tableHeaders = ["Month", "Combined SC", "R Net SC", "I Net SC", "Combined Sales", "R mROI", "I mROI", "Hours", "Combined Cost"];
      tableRows = D.map((d) => [
        d.short, fmtK(d.c_net_sc), fmtK(d.r_net_sc), fmtK(d.i_net_sc), fmtK(d.c_sales),
        fmtX(d.r_mroi), fmtX(d.i_mroi), fmtNum(d.hours), fmtK(d.c_cost)
      ]);
    }

    container.innerHTML = `<div class="dashboard-view">
      <div class="db-title">Monthly Intelligence Briefing — ${schoolName}</div>
      ${subTabs(subNames)}
      ${kpiRow(kpis)}
      <div class="chart-grid cols-2">
        ${chartCard("ch1", "Monthly Performance Overview", 320)}
        ${chartCard("ch2", "Revenue Layers", 280)}
        ${chartCard("ch3", "Efficiency Over Time", 280)}
      </div>
      ${dataTable("Full Metrics Table", tableHeaders, tableRows)}
    </div>`;
    bindSubTabs();

    if (prefix) {
      renderIntelSchool(prefix);
    } else {
      renderIntelCombined();
    }
  }

  function renderIntelSchool(p) {
    const revPC = col(p + "_net_churn");
    const maxRev = Math.max(...revPC);
    const minRev = Math.min(...revPC);

    mkChart("ch1", {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Net Rev Post Churn",
            data: revPC,
            backgroundColor: revPC.map((v) => {
              const pct = (v - minRev) / (maxRev - minRev || 1);
              if (pct > 0.66) return "rgba(16,185,129,0.5)";
              if (pct > 0.33) return "rgba(245,158,11,0.4)";
              return "rgba(239,68,68,0.4)";
            }),
            borderColor: revPC.map((v) => {
              const pct = (v - minRev) / (maxRev - minRev || 1);
              if (pct > 0.66) return C.emerald;
              if (pct > 0.33) return C.amber;
              return C.red;
            }),
            borderWidth: 1,
            borderRadius: barRadius,
            yAxisID: "yRev",
            order: 2,
            datalabels: { anchor: "end", align: "top", color: C.text, font: { size: 8, weight: "600" }, formatter: dlFmtK },
          },
          {
            label: "mROI",
            data: col(p + "_mroi"),
            type: "line",
            borderColor: C.indigo,
            pointBackgroundColor: C.indigo,
            pointRadius: 3,
            pointHoverRadius: 6,
            tension: 0.3,
            yAxisID: "yROI",
            order: 1,
            datalabels: { anchor: "end", align: "top", color: C.indigo, font: { size: 8, weight: "600" }, formatter: dlFmtX },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            labels: {
              color: C.textSec,
              font: { size: 10, family: "Inter" },
              boxWidth: 12,
              padding: 12,
              generateLabels: () => [
                { text: "Net Rev PC (green=high, red=low)", fillStyle: "rgba(16,185,129,0.5)", strokeStyle: C.emerald, lineWidth: 1 },
                { text: "mROI", fillStyle: "transparent", strokeStyle: C.indigo, lineWidth: 2 },
              ],
            },
          },
          tooltip: {
            ...baseTooltip,
            callbacks: {
              afterBody: (items) => {
                const i = items[0].dataIndex;
                const d = D[i];
                return [
                  `  Rank Net Rev PC: #${d["rk_"+p+"_net_churn"]}`,
                  `  Net Rev SC: ${fmtK(d[p+"_net_sc"])}  |  Sales: ${fmtK(d[p+"_sales"])}`,
                ];
              },
            },
          },
        },
        scales: {
          x: baseScaleX,
          yRev: { ...baseScaleY("Net Rev Post Churn ($)"), position: "left" },
          yROI: { position: "right", beginAtZero: true, title: { display: true, text: "mROI", color: C.indigo, font: { size: 10 } }, ticks: { color: C.indigo, font: { size: 9 }, callback: (v) => v.toFixed(1) + "x" }, grid: { display: false } },
        },
      },
    });

    mkChart("ch2", {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Sales Rev", data: col(p + "_sales"), fill: true, backgroundColor: "rgba(168,85,247,0.15)", borderColor: C.purple, pointRadius: 1, tension: 0.3, datalabels: { display: false } },
          { label: "Net Rev (S-C)", data: col(p + "_net_sc"), fill: true, backgroundColor: "rgba(6,182,212,0.15)", borderColor: C.cyan, pointRadius: 1, tension: 0.3, datalabels: { display: false } },
          { label: "Net Rev Post Churn", data: col(p + "_net_churn"), fill: true, backgroundColor: "rgba(16,185,129,0.15)", borderColor: C.emerald, pointRadius: 1, tension: 0.3, datalabels: { display: false } },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { labels: { color: C.textSec, font: { size: 10, family: "Inter" }, boxWidth: 12, padding: 12 } },
          tooltip: { ...baseTooltip, callbacks: { label: (ctx) => `${ctx.dataset.label}: ${fmtDollar(ctx.raw)}` } },
        },
        scales: { x: baseScaleX, y: baseScaleY("Revenue ($)") },
      },
    });

    mkChart("ch3", {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Hours",
            data: col("hours"),
            backgroundColor: "rgba(148,163,184,0.08)",
            borderColor: "rgba(148,163,184,0.15)",
            borderWidth: 1,
            borderRadius: barRadius,
            yAxisID: "yHours",
            order: 3,
            datalabels: { display: false },
          },
          { label: "Rev/Hr", data: col(p + "_rph"), type: "line", borderColor: C.cyan, pointBackgroundColor: C.cyan, pointRadius: 2, tension: 0.3, yAxisID: "yEff", order: 1, datalabels: { display: false } },
          { label: "mROI", data: col(p + "_mroi"), type: "line", borderColor: C.indigo, pointBackgroundColor: C.indigo, pointRadius: 2, tension: 0.3, yAxisID: "yROI2", order: 1, datalabels: { display: false } },
          { label: "ROAS", data: col(p + "_roas"), type: "line", borderColor: C.amber, borderDash: [4, 3], pointRadius: 2, tension: 0.3, yAxisID: "yROI2", order: 2, datalabels: { display: false } },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { labels: { color: C.textSec, font: { size: 10, family: "Inter" }, boxWidth: 12, padding: 12 } },
          tooltip: {
            ...baseTooltip,
            callbacks: {
              label: (ctx) => {
                const l = ctx.dataset.label;
                if (l === "Hours") return `Hours: ${fmtNum(ctx.raw)}`;
                if (l === "Rev/Hr") return `Rev/Hr: $${Math.round(ctx.raw)}`;
                return `${l}: ${fmtX(ctx.raw)}`;
              },
            },
          },
        },
        scales: {
          x: baseScaleX,
          yHours: { ...baseScaleY("Hours"), position: "left" },
          yEff: { display: false, beginAtZero: true },
          yROI2: { position: "right", beginAtZero: true, title: { display: true, text: "mROI / ROAS", color: C.textMuted, font: { size: 10 } }, ticks: { color: C.textMuted, font: { size: 9 }, callback: (v) => v.toFixed(1) + "x" }, grid: { display: false } },
        },
      },
    });
  }

  function renderIntelCombined() {
    const revData = col("c_net_sc");
    const maxRev = Math.max(...revData);
    const minRev = Math.min(...revData);

    mkChart("ch1", {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Combined Net Rev SC",
          data: revData,
          backgroundColor: revData.map((v) => {
            const pct = (v - minRev) / (maxRev - minRev || 1);
            if (pct > 0.66) return "rgba(16,185,129,0.5)";
            if (pct > 0.33) return "rgba(245,158,11,0.4)";
            return "rgba(239,68,68,0.4)";
          }),
          borderColor: revData.map((v) => {
            const pct = (v - minRev) / (maxRev - minRev || 1);
            if (pct > 0.66) return C.emerald;
            if (pct > 0.33) return C.amber;
            return C.red;
          }),
          borderWidth: 1,
          borderRadius: barRadius,
          datalabels: { anchor: "end", align: "top", color: C.text, font: { size: 8, weight: "600" }, formatter: dlFmtK },
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { labels: { color: C.textSec, font: { size: 10, family: "Inter" }, boxWidth: 12, padding: 12 } },
          tooltip: {
            ...baseTooltip,
            callbacks: {
              afterBody: (items) => {
                const i = items[0].dataIndex;
                const d = D[i];
                return [`  R: ${fmtK(d.r_net_sc)}  |  I: ${fmtK(d.i_net_sc)}`];
              },
            },
          },
        },
        scales: { x: baseScaleX, y: baseScaleY("Combined Net Rev SC ($)") },
      },
    });

    mkChart("ch2", {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Combined Sales", data: col("c_sales"), fill: true, backgroundColor: "rgba(168,85,247,0.12)", borderColor: C.purple, pointRadius: 1, tension: 0.3, datalabels: { display: false } },
          { label: "Combined Net SC", data: col("c_net_sc"), fill: true, backgroundColor: "rgba(6,182,212,0.12)", borderColor: C.cyan, pointRadius: 1, tension: 0.3, datalabels: { display: false } },
          { label: "Combined Cost", data: col("c_cost"), borderColor: C.red, borderDash: [5, 3], pointRadius: 1, tension: 0.3, datalabels: { display: false } },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { labels: { color: C.textSec, font: { size: 10, family: "Inter" }, boxWidth: 12, padding: 12 } },
          tooltip: { ...baseTooltip, callbacks: { label: (ctx) => `${ctx.dataset.label}: ${fmtDollar(ctx.raw)}` } },
        },
        scales: { x: baseScaleX, y: baseScaleY("Amount ($)") },
      },
    });

    mkChart("ch3", {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Hours",
            data: col("hours"),
            backgroundColor: "rgba(148,163,184,0.08)",
            borderColor: "rgba(148,163,184,0.15)",
            borderWidth: 1,
            borderRadius: barRadius,
            yAxisID: "yHours",
            order: 2,
            datalabels: { display: false },
          },
          { label: "R mROI", data: col("r_mroi"), type: "line", borderColor: C.cyan, pointRadius: 2, tension: 0.3, yAxisID: "yROI", order: 1, datalabels: { display: false } },
          { label: "I mROI", data: col("i_mroi"), type: "line", borderColor: C.amber, pointRadius: 2, tension: 0.3, yAxisID: "yROI", order: 1, datalabels: { display: false } },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { labels: { color: C.textSec, font: { size: 10, family: "Inter" }, boxWidth: 12, padding: 12 } },
          tooltip: {
            ...baseTooltip,
            callbacks: {
              label: (ctx) => {
                if (ctx.dataset.label === "Hours") return `Hours: ${fmtNum(ctx.raw)}`;
                return `${ctx.dataset.label}: ${fmtX(ctx.raw)}`;
              },
            },
          },
        },
        scales: {
          x: baseScaleX,
          yHours: { ...baseScaleY("Hours"), position: "left" },
          yROI: { position: "right", beginAtZero: true, title: { display: true, text: "mROI", color: C.textMuted, font: { size: 10 } }, ticks: { color: C.textMuted, font: { size: 9 }, callback: (v) => v.toFixed(1) + "x" }, grid: { display: false } },
        },
      },
    });
  }

  // ===========================================================================
  // RENDER DISPATCHER
  // ===========================================================================
  function render() {
    destroyCharts();
    if (activeDb === "overview") { renderOverview(); return; }
    switch (activeDb) {
      case 0: renderSchoolPL("r", "Rosen"); break;
      case 1: renderSchoolPL("i", "IIBS"); break;
      case 2: renderCombined(); break;
      case 3: renderZeroSum(); break;
      case 4:
        const fairPrefix = activeSubTab === 0 ? "r" : "i";
        renderFairContextForPrefix(fairPrefix);
        break;
      case 5: renderCEOOverview(); break;
      case 6: renderTopReps(); break;
      case 7: renderMonthlyIntel(); break;
    }
    if (activeDb === "init1") renderInit1();
    if (activeDb === "init2") renderInit2();
    if (activeDb === "init3") renderInit3();
    if (activeDb === "init4") renderInit4();
    if (activeDb === "init5") renderInit5();
    if (activeDb === "init6") renderInit6();
  }

  // ── Initiative KPI Row (supports cls for card accents and sub for subtitles) ──
  function initKpiRow(items) {
    const n = items.length;
    const gridCls = n <= 3 ? "cols-3" : n <= 4 ? "cols-4" : n <= 5 ? "cols-5" : "cols-6";
    return `<div class="kpi-row ${gridCls}">${items.map((k) =>
      `<div class="kpi-card${k.cls ? " " + k.cls : ""}">
        <div class="kpi-label">${k.label}</div>
        <div class="kpi-value">${k.value}</div>
        ${k.sub ? `<div style="font-size:11px;color:var(--text-muted);margin-top:4px;">${k.sub}</div>` : ""}
      </div>`
    ).join("")}</div>`;
  }

  // ===========================================================================
  // INITIATIVE 1: CALL CENTER BASELINES
  // ===========================================================================
  function renderInit1() {
    // Compute scatter data: X = r_pct_top, Y = r_net_sc
    const scatterPts = D.map(d => ({ x: d.r_pct_top, y: d.r_net_sc, label: d.short }));
    const aboveThresh = scatterPts.filter(p => p.x >= 75);
    const belowThresh = scatterPts.filter(p => p.x < 75);

    const avgAbove = avg(aboveThresh.map(p => p.y));
    const avgBelow = avg(belowThresh.map(p => p.y));

    container.innerHTML = `
      <div class="dashboard-view">
        <div class="init-headline">What Minimum Standards Should We Never Fall Below?</div>
        <div class="init-subtitle">Statistical analysis of 26 months reveals clear performance thresholds</div>

        ${initKpiRow([
          { label: "Golden Rosen Threshold", value: "75%", cls: "accent-green" },
          { label: "Golden IIBS Threshold", value: "60%", cls: "accent-green" },
          { label: "Correlation Rosen", value: "r = 0.71", sub: "p < 0.01" },
          { label: "Revenue at Stake", value: "$1.02M", cls: "accent-amber" },
        ])}

        <div class="chart-grid cols-2">
          <div class="chart-card span-2">
            <div class="chart-insight-title">The Proof: % Top Reps Directly Drives Net Revenue (r = 0.711, p < 0.01)</div>
            <div class="chart-insight-stat">Every 10% increase in top rep engagement ≈ ~$30K more net revenue</div>
            <div class="chart-wrap" style="height:340px;"><canvas id="init1c1"></canvas></div>
          </div>
          <div class="chart-card">
            <div class="chart-insight-title">Above vs Below the 75% Golden Threshold</div>
            <div class="chart-insight-stat">≥75% months (n=${aboveThresh.length}) vs <75% months (n=${belowThresh.length})</div>
            <div class="chart-wrap" style="height:300px;"><canvas id="init1c2"></canvas></div>
          </div>
          <div class="chart-card">
            <div class="chart-insight-title">What If Top Reps Got All High-Intent Leads?</div>
            <div class="chart-insight-stat">Lead assignment optimization — conversion rate simulation</div>
            <div class="chart-wrap" style="height:300px;"><canvas id="init1c3"></canvas></div>
          </div>
        </div>

        <div class="verdict-banner">
          <div class="verdict-label">Verdict</div>
          <div class="verdict-text">Maintaining ≥75% top rep engagement in Rosen and ≥60% in IIBS is the single highest-impact operational standard. Combined with directed lead assignment, the revenue upside exceeds $1.6M/month.</div>
        </div>
      </div>
    `;

    // Chart 1: Scatter — % Top Reps vs Net Rev (Rosen)
    // Compute trend line via least squares
    const xArr = D.map(d => d.r_pct_top);
    const yArr = D.map(d => d.r_net_sc);
    const n = xArr.length;
    const sumX = xArr.reduce((a, b) => a + b, 0);
    const sumY = yArr.reduce((a, b) => a + b, 0);
    const sumXY = xArr.reduce((a, x, i) => a + x * yArr[i], 0);
    const sumXX = xArr.reduce((a, x) => a + x * x, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const minX = Math.min(...xArr);
    const maxX = Math.max(...xArr);

    mkChart("init1c1", {
      type: "scatter",
      data: {
        datasets: [
          {
            label: "≥75% (Above Threshold)",
            data: aboveThresh,
            backgroundColor: "rgba(16,185,129,0.8)",
            borderColor: "#10B981",
            borderWidth: 1.5,
            pointRadius: 7,
            pointHoverRadius: 9,
          },
          {
            label: "<75% (Below Threshold)",
            data: belowThresh,
            backgroundColor: "rgba(239,68,68,0.7)",
            borderColor: "#EF4444",
            borderWidth: 1.5,
            pointRadius: 7,
            pointHoverRadius: 9,
          },
          {
            label: "Trend Line",
            type: "line",
            data: [{ x: minX, y: slope * minX + intercept }, { x: maxX, y: slope * maxX + intercept }],
            borderColor: "rgba(255,255,255,0.35)",
            borderWidth: 2,
            borderDash: [6, 4],
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, labels: { color: C.textSec, font: { size: 11 }, boxWidth: 12 } },
          tooltip: {
            ...baseTooltip,
            callbacks: {
              label: (ctx) => {
                const p = ctx.raw;
                return p.label ? `${p.label}: ${p.x.toFixed(0)}% Top Reps → ${fmtK(p.y)} Net Rev` : "";
              },
            },
          },
          datalabels: { display: false },
          annotation: {
            annotations: {
              threshold: {
                type: "line",
                xMin: 75, xMax: 75,
                borderColor: "rgba(16,185,129,0.5)",
                borderWidth: 2,
                borderDash: [6, 3],
                label: { display: true, content: "75% Threshold", position: "start", color: "#10B981", font: { size: 10 }, backgroundColor: "transparent" },
              },
              corrLabel: {
                type: "label",
                xValue: maxX - 5,
                yValue: Math.min(...yArr) + 20000,
                content: ["r = 0.711", "p < 0.01 — Statistically Significant"],
                color: "#10B981",
                font: { size: 11, weight: "bold" },
                backgroundColor: "rgba(16,185,129,0.08)",
                padding: 8,
                borderRadius: 4,
              },
            },
          },
        },
        scales: {
          x: { ...baseScaleX, type: "linear", title: { display: true, text: "% Top Reps Contacted (Rosen)", color: C.textMuted, font: { size: 11 } }, ticks: { ...baseScaleX.ticks, callback: v => v + "%" }, min: 0 },
          y: { ...baseScaleY("Net Revenue (S−C)"), ticks: { ...baseScaleY("").ticks, callback: v => fmtK(v) } },
        },
      },
    });

    // Chart 2: Above vs Below threshold comparison
    const avgAboveSales = avg(D.filter(d => d.r_pct_top >= 75).map(d => d.r_sales));
    const avgBelowSales = avg(D.filter(d => d.r_pct_top < 75).map(d => d.r_sales));
    const avgAboveMroi = avg(D.filter(d => d.r_pct_top >= 75).map(d => d.r_mroi));
    const avgBelowMroi = avg(D.filter(d => d.r_pct_top < 75).map(d => d.r_mroi));

    mkChart("init1c2", {
      type: "bar",
      data: {
        labels: ["Net Revenue", "Sales Revenue", "mROI"],
        datasets: [
          {
            label: "≥75% Months (n=" + aboveThresh.length + ")",
            data: [avgAbove, avgAboveSales, avgAboveMroi * 50000],
            backgroundColor: "rgba(16,185,129,0.7)",
            borderColor: "#10B981",
            borderWidth: 1,
            borderRadius: barRadius,
          },
          {
            label: "<75% Months (n=" + belowThresh.length + ")",
            data: [avgBelow, avgBelowSales, avgBelowMroi * 50000],
            backgroundColor: "rgba(239,68,68,0.5)",
            borderColor: "#EF4444",
            borderWidth: 1,
            borderRadius: barRadius,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, labels: { color: C.textSec, font: { size: 10 }, boxWidth: 10 } },
          tooltip: {
            ...baseTooltip,
            callbacks: {
              label: (ctx) => {
                if (ctx.dataIndex === 2) return ctx.dataset.label + ": " + (ctx.raw / 50000).toFixed(2) + "x";
                return ctx.dataset.label + ": " + fmtK(ctx.raw);
              },
            },
          },
          datalabels: {
            anchor: "end", align: "top",
            color: (ctx) => ctx.datasetIndex === 0 ? "#10B981" : "#EF4444",
            font: { size: 10, weight: "700" },
            formatter: (v, ctx) => {
              if (ctx.dataIndex === 2) return (v / 50000).toFixed(2) + "x";
              return fmtK(v);
            },
          },
          annotation: {
            annotations: {
              delta: {
                type: "label",
                xValue: 0,
                yValue: Math.max(avgAbove, avgBelow) + 30000,
                content: ["+42% NET REVENUE"],
                color: "#10B981",
                font: { size: 14, weight: "bold" },
                backgroundColor: "rgba(16,185,129,0.1)",
                padding: { top: 6, bottom: 6, left: 12, right: 12 },
                borderRadius: 6,
              },
            },
          },
        },
        scales: {
          x: baseScaleX,
          y: { ...baseScaleY(""), ticks: { ...baseScaleY("").ticks, callback: v => fmtK(v) } },
        },
      },
    });

    // Chart 3: Lead assignment optimization
    mkChart("init1c3", {
      type: "bar",
      data: {
        labels: ["Rosen Current", "Rosen Optimized", "IIBS Current", "IIBS Optimized"],
        datasets: [
          {
            label: "Monthly Revenue Potential",
            data: [
              avg(col("r_net_sc")),
              avg(col("r_net_sc")) + 529000,
              avg(col("i_net_sc")),
              avg(col("i_net_sc")) + 1120000,
            ],
            backgroundColor: [
              "rgba(6,182,212,0.4)",
              "rgba(6,182,212,0.85)",
              "rgba(245,158,11,0.4)",
              "rgba(245,158,11,0.85)",
            ],
            borderColor: [C.cyan, C.cyan, C.amber, C.amber],
            borderWidth: 1,
            borderRadius: barRadius,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            ...baseTooltip,
            callbacks: { label: (ctx) => fmtK(ctx.raw) },
          },
          datalabels: {
            anchor: "end", align: "top",
            color: (ctx) => ctx.dataIndex < 2 ? C.cyan : C.amber,
            font: { size: 10, weight: "700" },
            formatter: (v) => fmtK(v),
          },
          annotation: {
            annotations: {
              rDelta: {
                type: "label",
                xValue: 0.5,
                yValue: avg(col("r_net_sc")) + 529000 + 80000,
                content: ["+$529K/mo"],
                color: C.cyan,
                font: { size: 12, weight: "bold" },
                backgroundColor: "transparent",
              },
              iDelta: {
                type: "label",
                xValue: 2.5,
                yValue: avg(col("i_net_sc")) + 1120000 + 80000,
                content: ["+$1.12M/mo"],
                color: C.amber,
                font: { size: 12, weight: "bold" },
                backgroundColor: "transparent",
              },
            },
          },
        },
        scales: {
          x: baseScaleX,
          y: { ...baseScaleY("Net Revenue"), ticks: { ...baseScaleY("").ticks, callback: v => fmtK(v) } },
        },
      },
    });
  }

  // ===========================================================================
  // INITIATIVE 2: REP SEPARATION (ZERO-SUM)
  // ===========================================================================
  function renderInit2() {
    const repNames = ["Tessler Maia", "Tamir Yakov", "Getreuer Roy", "Rubens Fred", "Atkins Kimberly", "Levi Daniela"];

    // Compute total rev per rep per school
    const repTotals = repNames.map(name => {
      const recs = REP_DATA.filter(r => r.rep === name);
      return {
        name: name.split(" ")[0],
        rRev: recs.reduce((s, r) => s + (r.r_revenue || 0), 0),
        iRev: recs.reduce((s, r) => s + (r.i_revenue || 0), 0),
      };
    });

    container.innerHTML = `
      <div class="dashboard-view">
        <div class="init-headline">Should We Separate Sales Reps Across Schools or Keep Them Combined?</div>
        <div class="init-subtitle">Evidence from 307 rep-month data points across both schools</div>

        ${initKpiRow([
          { label: "Shared Top Reps", value: "6" },
          { label: "Revenue Impact", value: "$63K/mo" },
          { label: "Months Analyzed", value: "26" },
          { label: "Rep-Month Records", value: "307" },
        ])}

        <div class="chart-grid cols-2">
          <div class="chart-card span-2">
            <div class="chart-insight-title">The Bandwidth Trade-Off — When One School Wins, the Other Loses</div>
            <div class="chart-insight-stat">Grouped bars per month: Rosen % Top (cyan) vs IIBS % Top (amber)</div>
            <div class="chart-wrap" style="height:320px;"><canvas id="init2c1"></canvas></div>
          </div>
          <div class="chart-card">
            <div class="chart-insight-title">Top 6 Reps — Revenue Split Between Schools</div>
            <div class="chart-insight-stat">Total revenue divided between Rosen and IIBS across all months</div>
            <div class="chart-wrap" style="height:300px;"><canvas id="init2c2"></canvas></div>
          </div>
          <div class="chart-card">
            <div class="chart-insight-title">Revenue Follows Rep Attention</div>
            <div class="chart-insight-stat">Net revenue bars + % top rep overlay per month per school</div>
            <div class="chart-wrap" style="height:300px;"><canvas id="init2c3"></canvas></div>
          </div>
        </div>

        <div class="verdict-banner">
          <div class="verdict-label">Verdict</div>
          <div class="verdict-text">The same 6 rockstar reps consistently split bandwidth across schools. Dedicating reps to a single school would eliminate the zero-sum trade-off and allow each school to maintain peak conversion rates.</div>
        </div>
      </div>
    `;

    // Chart 1: Grouped bars — R % Top vs I % Top
    mkChart("init2c1", {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Rosen % Top",
            data: col("r_pct_top"),
            backgroundColor: "rgba(6,182,212,0.65)",
            borderColor: C.cyan,
            borderWidth: 1,
            borderRadius: barRadius,
          },
          {
            label: "IIBS % Top",
            data: col("i_pct_top"),
            backgroundColor: "rgba(245,158,11,0.55)",
            borderColor: C.amber,
            borderWidth: 1,
            borderRadius: barRadius,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, labels: { color: C.textSec, font: { size: 10 }, boxWidth: 10 } },
          tooltip: { ...baseTooltip, callbacks: { label: ctx => ctx.dataset.label + ": " + ctx.raw.toFixed(1) + "%" } },
          datalabels: {
            anchor: "end", align: "top",
            color: (ctx) => ctx.datasetIndex === 0 ? C.cyan : C.amber,
            font: { size: 8, weight: "600" },
            formatter: v => Math.round(v) + "%",
          },
        },
        scales: {
          x: baseScaleX,
          y: { ...baseScaleY("% Top Reps"), max: 100, ticks: { ...baseScaleY("").ticks, callback: v => v + "%" } },
        },
      },
    });

    // Chart 2: Horizontal stacked bar — Top 6 reps revenue split
    mkChart("init2c2", {
      type: "bar",
      data: {
        labels: repTotals.map(r => r.name),
        datasets: [
          {
            label: "Rosen Revenue",
            data: repTotals.map(r => r.rRev),
            backgroundColor: "rgba(6,182,212,0.7)",
            borderColor: C.cyan,
            borderWidth: 1,
            borderRadius: barRadius,
          },
          {
            label: "IIBS Revenue",
            data: repTotals.map(r => r.iRev),
            backgroundColor: "rgba(245,158,11,0.65)",
            borderColor: C.amber,
            borderWidth: 1,
            borderRadius: barRadius,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, labels: { color: C.textSec, font: { size: 10 }, boxWidth: 10 } },
          tooltip: { ...baseTooltip, callbacks: { label: ctx => ctx.dataset.label + ": " + fmtK(ctx.raw) } },
          datalabels: {
            color: "#fff",
            font: { size: 9, weight: "600" },
            formatter: v => v > 50000 ? fmtK(v) : "",
          },
        },
        scales: {
          x: { ...baseScaleY("Total Revenue"), stacked: true, ticks: { ...baseScaleY("").ticks, callback: v => fmtK(v) } },
          y: { ...baseScaleX, stacked: true, ticks: { ...baseScaleX.ticks, font: { size: 13, weight: "600" } } },
        },
      },
    });

    // Chart 3: Dual axis — Revenue bars + % top lines
    mkChart("init2c3", {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "R Net Rev",
            data: col("r_net_sc"),
            backgroundColor: "rgba(6,182,212,0.3)",
            borderColor: C.cyan,
            borderWidth: 1,
            borderRadius: barRadius,
            yAxisID: "yRev",
            order: 2,
          },
          {
            label: "I Net Rev",
            data: col("i_net_sc"),
            backgroundColor: "rgba(245,158,11,0.25)",
            borderColor: C.amber,
            borderWidth: 1,
            borderRadius: barRadius,
            yAxisID: "yRev",
            order: 2,
          },
          {
            label: "R % Top",
            type: "line",
            data: col("r_pct_top"),
            borderColor: C.cyan,
            borderWidth: 2,
            pointRadius: 3,
            tension: 0.3,
            yAxisID: "yPct",
            order: 1,
          },
          {
            label: "I % Top",
            type: "line",
            data: col("i_pct_top"),
            borderColor: C.amber,
            borderWidth: 2,
            pointRadius: 3,
            tension: 0.3,
            yAxisID: "yPct",
            order: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, labels: { color: C.textSec, font: { size: 9 }, boxWidth: 10 } },
          tooltip: { ...baseTooltip },
          datalabels: { display: false },
        },
        scales: {
          x: baseScaleX,
          yRev: { ...baseScaleY("Net Revenue"), position: "left", ticks: { ...baseScaleY("").ticks, callback: v => fmtK(v) } },
          yPct: { position: "right", beginAtZero: true, max: 100, title: { display: true, text: "% Top Reps", color: C.textMuted, font: { size: 10 } }, ticks: { color: C.textMuted, font: { size: 9 }, callback: v => v + "%" }, grid: { display: false } },
        },
      },
    });
  }

  // ===========================================================================
  // INITIATIVE 3: AD ACCOUNT CPL INSTABILITY
  // ===========================================================================
  function renderInit3() {
    const rCPL = col("r_cpl");
    const iCPL = col("i_cpl");
    const rAvgCPL = avg(rCPL);
    const iAvgCPL = avg(iCPL);

    // MoM swings
    const rSwings = rCPL.slice(1).map((v, i) => ((v - rCPL[i]) / rCPL[i]) * 100);
    const iSwings = iCPL.slice(1).map((v, i) => ((v - iCPL[i]) / iCPL[i]) * 100);
    const swingLabels = labels.slice(1);

    container.innerHTML = `
      <div class="dashboard-view">
        <div class="init-headline">Are Ad Accounts Too Unstable for Reliable Performance?</div>
        <div class="init-subtitle">CPL fluctuation analysis vs industry benchmarks</div>

        ${initKpiRow([
          { label: "Rosen CPL Volatility", value: "14.3% CV", cls: "accent-amber" },
          { label: "IIBS CPL Volatility", value: "18.7% CV", cls: "accent-red" },
          { label: "Industry Benchmark", value: "~10% CV" },
          { label: "Revenue at Risk", value: "$16K per $1 CPL", sub: "IIBS" },
        ])}

        <div class="chart-grid cols-2">
          <div class="chart-card span-2">
            <div class="chart-insight-title">CPL Month-over-Month Swings Exceed Industry Stability Norms</div>
            <div class="chart-insight-stat">Line chart: Rosen CPL + IIBS CPL over 26 months — shaded band = industry normal range</div>
            <div class="chart-wrap" style="height:320px;"><canvas id="init3c1"></canvas></div>
          </div>
          <div class="chart-card">
            <div class="chart-insight-title">Revenue Impact of CPL Instability</div>
            <div class="chart-insight-stat">CPL deviation from average × revenue impact factor per month</div>
            <div class="chart-wrap" style="height:300px;"><canvas id="init3c2"></canvas></div>
          </div>
          <div class="chart-card">
            <div class="chart-insight-title">Months with >20% CPL Swings — Both Schools Hit Danger Zone</div>
            <div class="chart-insight-stat">MoM % swings sorted by magnitude — industry threshold at 15%</div>
            <div class="chart-wrap" style="height:300px;"><canvas id="init3c3"></canvas></div>
          </div>
        </div>

        <div class="verdict-banner">
          <div class="verdict-label">Verdict</div>
          <div class="verdict-text">Both ad accounts show volatility at or above industry danger levels. IIBS at 18.7% CV is particularly unstable. Moving to fresh Business Manager accounts should reduce CPL volatility to the 8-10% range, stabilizing revenue planning.</div>
        </div>
      </div>
    `;

    // Chart 1: CPL line chart with industry band
    const rBandHigh = rCPL.map(() => rAvgCPL * 1.15);
    const rBandLow = rCPL.map(() => rAvgCPL * 0.85);

    mkChart("init3c1", {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Industry Upper Bound (±15%)",
            data: labels.map(() => Math.max(rAvgCPL * 1.15, iAvgCPL * 1.15)),
            borderColor: "transparent",
            backgroundColor: "rgba(16,185,129,0.06)",
            fill: "+1",
            pointRadius: 0,
          },
          {
            label: "Industry Lower Bound",
            data: labels.map(() => Math.min(rAvgCPL * 0.85, iAvgCPL * 0.85)),
            borderColor: "transparent",
            backgroundColor: "transparent",
            fill: false,
            pointRadius: 0,
          },
          {
            label: "Rosen CPL",
            data: rCPL,
            borderColor: C.cyan,
            borderWidth: 2.5,
            pointRadius: 4,
            pointBackgroundColor: rCPL.map((v, i) => {
              if (i === 0) return C.cyan;
              const swing = Math.abs((v - rCPL[i - 1]) / rCPL[i - 1]);
              return swing > 0.2 ? C.red : C.cyan;
            }),
            tension: 0.3,
            fill: false,
          },
          {
            label: "IIBS CPL",
            data: iCPL,
            borderColor: C.amber,
            borderWidth: 2.5,
            pointRadius: 4,
            pointBackgroundColor: iCPL.map((v, i) => {
              if (i === 0) return C.amber;
              const swing = Math.abs((v - iCPL[i - 1]) / iCPL[i - 1]);
              return swing > 0.2 ? C.red : C.amber;
            }),
            tension: 0.3,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, labels: { color: C.textSec, font: { size: 10 }, boxWidth: 10, filter: (item) => !item.text.includes("Bound") } },
          tooltip: { ...baseTooltip, callbacks: { label: ctx => ctx.dataset.label + ": $" + (ctx.raw || 0).toFixed(1) } },
          datalabels: { display: false },
          annotation: {
            annotations: {
              bandLabel: {
                type: "label",
                xValue: labels.length - 3,
                yValue: Math.max(rAvgCPL, iAvgCPL) * 1.15 + 2,
                content: ["Industry Normal Range"],
                color: "#10B981",
                font: { size: 10 },
                backgroundColor: "transparent",
              },
            },
          },
        },
        scales: {
          x: baseScaleX,
          y: { ...baseScaleY("CPL ($)"), ticks: { ...baseScaleY("").ticks, callback: v => "$" + v } },
        },
      },
    });

    // Chart 2: Revenue impact of CPL deviation
    const rImpact = rCPL.map(v => (v - rAvgCPL) * -5981);
    const iImpact = iCPL.map(v => (v - iAvgCPL) * -16429);

    mkChart("init3c2", {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Rosen Revenue Impact",
            data: rImpact,
            backgroundColor: rImpact.map(v => v >= 0 ? "rgba(16,185,129,0.5)" : "rgba(239,68,68,0.5)"),
            borderColor: rImpact.map(v => v >= 0 ? "#10B981" : "#EF4444"),
            borderWidth: 1,
            borderRadius: barRadius,
          },
          {
            label: "IIBS Revenue Impact",
            data: iImpact,
            backgroundColor: iImpact.map(v => v >= 0 ? "rgba(6,182,212,0.4)" : "rgba(245,158,11,0.5)"),
            borderColor: iImpact.map(v => v >= 0 ? C.cyan : C.amber),
            borderWidth: 1,
            borderRadius: barRadius,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, labels: { color: C.textSec, font: { size: 10 }, boxWidth: 10 } },
          tooltip: { ...baseTooltip, callbacks: { label: ctx => ctx.dataset.label + ": " + fmtK(ctx.raw) } },
          datalabels: { display: false },
        },
        scales: {
          x: baseScaleX,
          y: { ...baseScaleY("Revenue Impact ($)"), ticks: { ...baseScaleY("").ticks, callback: v => fmtK(v) } },
        },
      },
    });

    // Chart 3: MoM swings sorted — both schools combined
    const allSwings = rSwings.map((v, i) => ({ label: swingLabels[i] + " (R)", value: Math.abs(v), raw: v }))
      .concat(iSwings.map((v, i) => ({ label: swingLabels[i] + " (I)", value: Math.abs(v), raw: v })))
      .sort((a, b) => b.value - a.value)
      .slice(0, 20);

    mkChart("init3c3", {
      type: "bar",
      data: {
        labels: allSwings.map(s => s.label),
        datasets: [{
          label: "MoM % Swing (Absolute)",
          data: allSwings.map(s => s.value),
          backgroundColor: allSwings.map(s => s.value > 20 ? "rgba(239,68,68,0.6)" : s.value > 15 ? "rgba(245,158,11,0.5)" : "rgba(148,163,184,0.3)"),
          borderColor: allSwings.map(s => s.value > 20 ? C.red : s.value > 15 ? C.amber : C.textMuted),
          borderWidth: 1,
          borderRadius: barRadius,
        }],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { ...baseTooltip, callbacks: { label: ctx => ctx.raw.toFixed(1) + "% swing" } },
          datalabels: {
            anchor: "end", align: "right",
            color: (ctx) => allSwings[ctx.dataIndex].value > 20 ? C.red : C.textSec,
            font: { size: 9, weight: "600" },
            formatter: v => v.toFixed(1) + "%",
          },
          annotation: {
            annotations: {
              threshold15: {
                type: "line",
                xMin: 15, xMax: 15,
                borderColor: "rgba(245,158,11,0.5)",
                borderWidth: 2,
                borderDash: [5, 3],
                label: { display: true, content: "15% Industry Threshold", position: "start", color: C.amber, font: { size: 9 }, backgroundColor: "transparent" },
              },
            },
          },
        },
        scales: {
          x: { ...baseScaleY("% MoM Swing"), ticks: { ...baseScaleY("").ticks, callback: v => v + "%" } },
          y: { ...baseScaleX, ticks: { ...baseScaleX.ticks, font: { size: 8 } } },
        },
      },
    });
  }

  // ===========================================================================
  // INITIATIVE 4: LEAD TARGETS
  // ===========================================================================
  function renderInit4() {
    const rTarget = 3438;
    const iTarget = 9360;
    const rActual = col("r_leads");
    const iActual = col("i_leads");
    const rAvgActual = avg(rActual);
    const iAvgActual = avg(iActual);
    const rLast6 = avg(rActual.slice(-6));
    const iLast6 = avg(iActual.slice(-6));

    // Revenue at current avg vs at target
    const rAvgConv = avg(col("r_conv")) / 100;
    const iAvgConv = avg(col("i_conv")) / 100;
    const rAvgSalePerAcq = avg(col("r_sales")) / avg(col("r_acq"));
    const iAvgSalePerAcq = avg(col("i_sales")) / avg(col("i_acq"));

    container.innerHTML = `
      <div class="dashboard-view">
        <div class="init-headline">Are We Hitting Lead Targets? What's the Revenue Cost?</div>
        <div class="init-subtitle">Actual lead delivery vs targets and the bottom-line impact</div>

        ${initKpiRow([
          { label: "Rosen Gap", value: "32% Under", cls: "accent-red" },
          { label: "IIBS Gap", value: "28% Under", cls: "accent-red" },
          { label: "Combined Monthly Revenue Gap", value: "$291K" },
          { label: "Annual Revenue Opportunity", value: "$3.5M", cls: "accent-green" },
        ])}

        <div class="chart-grid cols-2">
          <div class="chart-card span-2">
            <div class="chart-insight-title">Target vs Actual Lead Delivery — Persistent Shortfall in Both Schools</div>
            <div class="chart-insight-stat">Red shading = gap between actual and target each month</div>
            <div class="chart-wrap" style="height:340px;"><canvas id="init4c1"></canvas></div>
          </div>
          <div class="chart-card">
            <div class="chart-insight-title">Current Lead Targets — Daily Breakdown</div>
            <div class="chart-insight-stat">English + Spanish targets by school</div>
            <div style="padding: 8px 0;">
              <table class="target-table">
                <thead>
                  <tr><th>Segment</th><th>IIBS Daily</th><th>Rosen Daily</th><th>IIBS Monthly</th><th>Rosen Monthly</th></tr>
                </thead>
                <tbody>
                  <tr><td>English</td><td>192</td><td>68</td><td>6,500</td><td>2,438</td></tr>
                  <tr><td>Spanish</td><td>104</td><td>33</td><td>2,860</td><td>1,000</td></tr>
                  <tr class="total-row"><td>Total</td><td>296</td><td>101</td><td>9,360</td><td>3,438</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="chart-card">
            <div class="chart-insight-title">The Revenue Left on the Table</div>
            <div class="chart-insight-stat">At current delivery vs at target delivery</div>
            <div class="chart-wrap" style="height:260px;"><canvas id="init4c3"></canvas></div>
          </div>
        </div>

        <div class="verdict-banner">
          <div class="verdict-label">Verdict</div>
          <div class="verdict-text">Consistently 28-32% below lead targets in both schools. At current conversion rates, closing this gap would add $291K/month ($3.5M/year) in revenue. This requires proportional media spend increases and better lead-to-rep allocation.</div>
        </div>
      </div>
    `;

    // Chart 1: Target vs Actual — dual school
    mkChart("init4c1", {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Rosen Actual Leads",
            data: rActual,
            backgroundColor: "rgba(6,182,212,0.6)",
            borderColor: C.cyan,
            borderWidth: 1,
            borderRadius: barRadius,
            stack: "r",
          },
          {
            label: "Rosen Gap to Target",
            data: rActual.map(v => Math.max(0, rTarget - v)),
            backgroundColor: "rgba(239,68,68,0.25)",
            borderColor: "rgba(239,68,68,0.4)",
            borderWidth: 1,
            borderRadius: barRadius,
            stack: "r",
          },
          {
            label: "IIBS Actual Leads",
            data: iActual,
            backgroundColor: "rgba(245,158,11,0.55)",
            borderColor: C.amber,
            borderWidth: 1,
            borderRadius: barRadius,
            stack: "i",
          },
          {
            label: "IIBS Gap to Target",
            data: iActual.map(v => Math.max(0, iTarget - v)),
            backgroundColor: "rgba(239,68,68,0.25)",
            borderColor: "rgba(239,68,68,0.4)",
            borderWidth: 1,
            borderRadius: barRadius,
            stack: "i",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, labels: { color: C.textSec, font: { size: 10 }, boxWidth: 10 } },
          tooltip: {
            ...baseTooltip,
            callbacks: { label: ctx => ctx.dataset.label + ": " + fmtNum(ctx.raw) },
          },
          datalabels: { display: false },
          annotation: {
            annotations: {
              rTarget: {
                type: "line",
                yMin: rTarget, yMax: rTarget,
                borderColor: "rgba(6,182,212,0.4)",
                borderWidth: 1.5,
                borderDash: [6, 3],
                label: { display: true, content: "Rosen Target: 3,438", position: "start", color: C.cyan, font: { size: 9 }, backgroundColor: "transparent" },
              },
              iTarget: {
                type: "line",
                yMin: iTarget, yMax: iTarget,
                borderColor: "rgba(245,158,11,0.4)",
                borderWidth: 1.5,
                borderDash: [6, 3],
                label: { display: true, content: "IIBS Target: 9,360", position: "end", color: C.amber, font: { size: 9 }, backgroundColor: "transparent" },
              },
            },
          },
        },
        scales: {
          x: baseScaleX,
          y: { ...baseScaleY("Leads"), ticks: { ...baseScaleY("").ticks, callback: v => fmtNum(v) } },
        },
      },
    });

    // Chart 3: Revenue comparison — current vs at-target
    const rCurrentRev = avg(col("r_net_sc"));
    const iCurrentRev = avg(col("i_net_sc"));
    const combinedCurrent = rCurrentRev + iCurrentRev;
    const combinedTarget = combinedCurrent + 291000;

    mkChart("init4c3", {
      type: "bar",
      data: {
        labels: ["Current Delivery", "At Target Delivery"],
        datasets: [
          {
            label: "Rosen Net Rev",
            data: [rCurrentRev, rCurrentRev + 141000],
            backgroundColor: ["rgba(6,182,212,0.5)", "rgba(6,182,212,0.8)"],
            borderColor: C.cyan,
            borderWidth: 1,
            borderRadius: barRadius,
          },
          {
            label: "IIBS Net Rev",
            data: [iCurrentRev, iCurrentRev + 150000],
            backgroundColor: ["rgba(245,158,11,0.4)", "rgba(245,158,11,0.75)"],
            borderColor: C.amber,
            borderWidth: 1,
            borderRadius: barRadius,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, labels: { color: C.textSec, font: { size: 10 }, boxWidth: 10 } },
          tooltip: { ...baseTooltip, callbacks: { label: ctx => ctx.dataset.label + ": " + fmtK(ctx.raw) } },
          datalabels: {
            anchor: "end", align: "top",
            color: (ctx) => ctx.datasetIndex === 0 ? C.cyan : C.amber,
            font: { size: 10, weight: "700" },
            formatter: v => fmtK(v),
          },
          annotation: {
            annotations: {
              deltaLabel: {
                type: "label",
                xValue: 1,
                yValue: combinedTarget * 0.55,
                content: ["+$291K/mo", "+$3.5M/year"],
                color: "#10B981",
                font: { size: 14, weight: "bold" },
                backgroundColor: "rgba(16,185,129,0.08)",
                padding: { top: 8, bottom: 8, left: 14, right: 14 },
                borderRadius: 6,
              },
            },
          },
        },
        scales: {
          x: baseScaleX,
          y: { ...baseScaleY("Monthly Net Revenue"), stacked: true, ticks: { ...baseScaleY("").ticks, callback: v => fmtK(v) } },
        },
      },
    });
  }

  // ===========================================================================
  // OVERVIEW TAB
  // ===========================================================================
  function renderOverview() {
    function navTo(db) {
      activeDb = db;
      activeSubTab = 0;
      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach(b => {
        b.classList.toggle('active', b.dataset.db === String(db));
      });
      render();
    }

    container.innerHTML = `<div class="dashboard-view">
      <div class="init-headline">Strategic Initiatives — Overview</div>
      <div class="init-subtitle">All initiatives grouped by implementation timeline. Combined addressable opportunity: $7.2M annually.</div>

      <div class="overview-columns">
        <!-- LEFT: IMMEDIATE -->
        <div>
          <div class="overview-col-header green">
            <span class="header-dot"></span>
            Immediate Steps
          </div>

          <div class="overview-box">
            <div class="overview-box-title">Set Baseline Standards</div>
            <div class="overview-box-desc">Golden thresholds, calls/lead optimal, never fall below minimums</div>
            <span class="overview-box-link" data-nav="init1">See Tab &rarr;</span>
          </div>

          <div class="overview-box">
            <div class="overview-box-title">Weekend Coverage Expansion</div>
            <div class="overview-box-desc">80% Saturday coverage + Sunday shifts = +$48K/mo</div>
            <span class="overview-box-link" data-nav="init6">See Tab &rarr;</span>
          </div>
        </div>

        <!-- RIGHT: MID-TERM -->
        <div>
          <div class="overview-col-header amber">
            <span class="header-dot"></span>
            Mid-Term Steps (May / 90 Days)
          </div>

          <div class="overview-box">
            <div class="overview-box-title">Separate Reps by School</div>
            <div class="overview-box-desc">Eliminate zero-sum bandwidth, dedicated conversion optimization</div>
            <span class="overview-box-link" data-nav="init2">See Tab &rarr;</span>
          </div>

          <div class="overview-box">
            <div class="overview-box-title">LeadGen Model Pilot</div>
            <div class="overview-box-desc">Test low-CPL lead gen at 25% of budget on new reps</div>
            <span class="overview-box-link" data-nav="init5">See Tab &rarr;</span>
          </div>

          <div class="overview-box">
            <div class="overview-box-title">New CRM + Ad Accounts</div>
            <div class="overview-box-desc">Stabilize CPL fluctuation, modern lead routing</div>
            <span class="overview-box-link" data-nav="init3">See Tab &rarr;</span>
          </div>

          <div class="overview-box">
            <div class="overview-box-title">Lead Target Rebalancing</div>
            <div class="overview-box-desc">Close the 28-32% delivery gap = +$291K/mo</div>
            <span class="overview-box-link" data-nav="init4">See Tab &rarr;</span>
          </div>
        </div>
      </div>

      <div class="overview-impact-banner">
        <div class="overview-impact-label">Combined Annual Impact</div>
        <div class="overview-impact-value">$7.2M</div>
        <div class="overview-impact-sub">Baselines $756K + Weekend $576K + Lead Gap $3.5M + LeadGen $2.4M</div>
      </div>
    </div>`;

    // Bind "See Tab" links
    document.querySelectorAll('.overview-box-link[data-nav]').forEach(link => {
      link.addEventListener('click', () => navTo(link.dataset.nav));
    });
  }

  // ===========================================================================
  // INITIATIVE 5: LEADGEN PILOT
  // ===========================================================================
  function renderInit5() {
    container.innerHTML = `<div class="dashboard-view">
      <div class="init-headline">Can a Low-CPL LeadGen Model Deliver Better ROI?</div>
      <div class="init-subtitle">Piloting 25% of media budget at $25 CPL with new reps — May target</div>

      ${initKpiRow([
        { label: "Test Budget Rosen", value: "$29K/mo", cls: "accent-amber" },
        { label: "Test Budget IIBS", value: "$40K/mo", cls: "accent-amber" },
        { label: "Projected ROI Rosen", value: "180%", cls: "accent-green" },
        { label: "Projected ROI IIBS", value: "194%", cls: "accent-green" },
      ])}

      <!-- Chart 1: How it works - comparison cards -->
      <div class="chart-card" style="margin-bottom:22px;">
        <div class="chart-card-title">The LeadGen Model — How It Works</div>
        <div class="comparison-grid">
          <div class="comparison-card">
            <div class="comparison-card-header current">Current Model</div>
            <div class="comparison-row">
              <span class="comparison-row-label">CPL</span>
              <span class="comparison-row-value">$50 (R) / $24 (I)</span>
            </div>
            <div class="comparison-row">
              <span class="comparison-row-label">Conversion Rate</span>
              <span class="comparison-row-value">8.9% (R) / 3.9% (I)</span>
            </div>
            <div class="comparison-row">
              <span class="comparison-row-label">Lead Quality</span>
              <span class="comparison-row-value">High-intent, expensive</span>
            </div>
            <div class="comparison-row">
              <span class="comparison-row-label">Rep Expectation</span>
              <span class="comparison-row-value">18%+ conversion</span>
            </div>
          </div>
          <div class="comparison-card">
            <div class="comparison-card-header leadgen">LeadGen Model</div>
            <div class="comparison-row">
              <span class="comparison-row-label">CPL</span>
              <span class="comparison-row-value" style="color:#10B981;">$25 both</span>
            </div>
            <div class="comparison-row">
              <span class="comparison-row-label">Conversion Rate</span>
              <span class="comparison-row-value">5% target</span>
            </div>
            <div class="comparison-row">
              <span class="comparison-row-label">Lead Quality</span>
              <span class="comparison-row-value">Lower-intent, 70% cheaper</span>
            </div>
            <div class="comparison-row">
              <span class="comparison-row-label">Rep Expectation</span>
              <span class="comparison-row-value">New reps, no expectations</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Chart 2: ROI Comparison -->
      <div class="chart-grid cols-2">
        ${chartCard("init5ch1", "ROI Comparison at 25% Budget Test", 320)}

        <!-- Chart 3: Timeline -->
        <div class="chart-card">
          <div class="chart-card-title">Test Plan — Implementation Timeline</div>
          <div class="timeline-container">
            <div class="timeline-item">
              <div class="timeline-dot"></div>
              <div>
                <div class="timeline-label">Week 1-2</div>
                <div class="timeline-text">Recruit 2-3 new LeadGen reps per school</div>
              </div>
            </div>
            <div class="timeline-item">
              <div class="timeline-dot" style="background:var(--accent-cyan);"></div>
              <div>
                <div class="timeline-label" style="color:var(--accent-cyan);">Week 3-4</div>
                <div class="timeline-text">Launch $25 CPL campaigns (25% of budget)</div>
              </div>
            </div>
            <div class="timeline-item">
              <div class="timeline-dot" style="background:var(--accent-amber);"></div>
              <div>
                <div class="timeline-label" style="color:var(--accent-amber);">Month 2</div>
                <div class="timeline-text">Measure conversion rates, adjust targeting and scripts</div>
              </div>
            </div>
            <div class="timeline-item">
              <div class="timeline-dot" style="background:var(--accent-emerald);"></div>
              <div>
                <div class="timeline-label" style="color:var(--accent-emerald);">Month 3</div>
                <div class="timeline-text">Scale decision based on results — expand or reallocate</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="verdict-banner">
        <div class="verdict-label">Verdict</div>
        <div class="verdict-text">At $25 CPL with conservative 5% conversion, the LeadGen model delivers 180-194% ROI vs 136-151% on current model. Lower risk per lead, better unit economics, no disruption to existing high-performer pipeline.</div>
      </div>
    </div>`;

    // ROI Comparison Chart
    mkChart("init5ch1", {
      type: "bar",
      data: {
        labels: ["Rosen", "IIBS"],
        datasets: [
          {
            label: "Current Model ROI",
            data: [151, 136],
            backgroundColor: C.amberFade,
            borderColor: C.amber,
            borderWidth: 1,
            borderRadius: barRadius,
            barPercentage: 0.6,
            categoryPercentage: 0.7,
            datalabels: { anchor: "end", align: "top", color: C.amber, font: { size: 12, weight: "700" }, formatter: v => v + "%" },
          },
          {
            label: "LeadGen Model ROI",
            data: [180, 194],
            backgroundColor: C.emeraldFade,
            borderColor: C.emerald,
            borderWidth: 1,
            borderRadius: barRadius,
            barPercentage: 0.6,
            categoryPercentage: 0.7,
            datalabels: { anchor: "end", align: "top", color: C.emerald, font: { size: 12, weight: "700" }, formatter: v => v + "%" },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: C.textSec, font: { size: 10, family: "Inter" }, boxWidth: 12, padding: 12 } },
          tooltip: {
            ...baseTooltip,
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ${ctx.raw}%`,
              afterBody: (items) => {
                const i = items[0].dataIndex;
                if (i === 0) return "Rosen: $81K rev on $29K spend";
                return "IIBS: $116K rev on $40K spend";
              },
            },
          },
          annotation: {
            annotations: {
              rosenLabel: {
                type: "label",
                xValue: 0,
                yValue: 40,
                content: ["$81K rev", "on $29K spend"],
                font: { size: 9, family: "Inter" },
                color: C.textMuted,
              },
              iibsLabel: {
                type: "label",
                xValue: 1,
                yValue: 40,
                content: ["$116K rev", "on $40K spend"],
                font: { size: 9, family: "Inter" },
                color: C.textMuted,
              },
            },
          },
        },
        scales: {
          x: baseScaleX,
          y: { ...baseScaleY("ROI %"), max: 240, ticks: { ...baseScaleY("").ticks, callback: v => v + "%" } },
        },
      },
    });
  }

  // ===========================================================================
  // INITIATIVE 6: WEEKEND COVERAGE
  // ===========================================================================
  function renderInit6() {
    container.innerHTML = `<div class="dashboard-view">
      <div class="init-headline">How Much Revenue Are We Losing on Weekends?</div>
      <div class="init-subtitle">80% Saturday coverage + Sunday shifts — immediate implementation</div>

      ${initKpiRow([
        { label: "Saturday Revenue", value: "$16K", sub: "per school/mo (4 Sat × $4K)", cls: "accent-green" },
        { label: "Sunday Revenue", value: "$8K", sub: "per school/mo (4 Sun × $2K)", cls: "accent-green" },
        { label: "Combined Monthly", value: "$48K", sub: "both schools", cls: "accent-amber" },
        { label: "Annual Impact", value: "$576K", sub: "12 months", cls: "accent-green" },
      ])}

      <div class="chart-grid cols-2">
        ${chartCard("init6ch1", "Weekend Revenue Opportunity", 320)}
        ${chartCard("init6ch2", "Annual Impact Projection", 320)}
      </div>

      <div class="verdict-banner">
        <div class="verdict-label">Verdict</div>
        <div class="verdict-text">Weekend coverage expansion requires only scheduling changes — no new hires, no technology, no budget increase. Immediate +$48K/month (+$576K/year) at near-zero marginal cost.</div>
      </div>
    </div>`;

    // Chart 1: Weekend Revenue Opportunity (stacked bar)
    mkChart("init6ch1", {
      type: "bar",
      data: {
        labels: ["Rosen", "IIBS", "Total"],
        datasets: [
          {
            label: "Saturday",
            data: [16000, 16000, 32000],
            backgroundColor: C.emeraldFade,
            borderColor: C.emerald,
            borderWidth: 1,
            borderRadius: barRadius,
            datalabels: { anchor: "center", align: "center", color: C.emerald, font: { size: 11, weight: "600" }, formatter: v => fmtK(v) },
          },
          {
            label: "Sunday",
            data: [8000, 8000, 16000],
            backgroundColor: C.cyanFade,
            borderColor: C.cyan,
            borderWidth: 1,
            borderRadius: barRadius,
            datalabels: { anchor: "center", align: "center", color: C.cyan, font: { size: 11, weight: "600" }, formatter: v => fmtK(v) },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: C.textSec, font: { size: 10, family: "Inter" }, boxWidth: 12, padding: 12 } },
          tooltip: {
            ...baseTooltip,
            callbacks: { label: ctx => `${ctx.dataset.label}: ${fmtK(ctx.raw)}` },
          },
        },
        scales: {
          x: baseScaleX,
          y: { ...baseScaleY("Revenue / Month"), stacked: true, ticks: { ...baseScaleY("").ticks, callback: v => fmtK(v) } },
        },
      },
    });

    // Chart 2: Annual Impact Projection
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const cumulative = months.map((_, i) => 48000 * (i + 1));

    mkChart("init6ch2", {
      type: "bar",
      data: {
        labels: months,
        datasets: [
          {
            label: "Cumulative Revenue",
            data: cumulative,
            backgroundColor: cumulative.map((v, i) => i === 11 ? C.emerald : C.emeraldFade),
            borderColor: C.emerald,
            borderWidth: 1,
            borderRadius: barRadius,
            datalabels: {
              display: (ctx) => ctx.dataIndex % 3 === 2 || ctx.dataIndex === 11,
              anchor: "end", align: "top",
              color: C.emerald,
              font: { size: 9, weight: "600" },
              formatter: v => fmtK(v),
            },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            ...baseTooltip,
            callbacks: { label: ctx => `Cumulative: ${fmtK(ctx.raw)}` },
          },
          annotation: {
            annotations: {
              target: {
                type: "line",
                yMin: 576000,
                yMax: 576000,
                borderColor: C.amber,
                borderWidth: 1.5,
                borderDash: [6, 4],
                label: {
                  display: true,
                  content: "$576K Annual Target",
                  position: "start",
                  backgroundColor: "rgba(245,158,11,0.15)",
                  color: C.amber,
                  font: { size: 10, weight: "600", family: "Inter" },
                  padding: 4,
                },
              },
              note: {
                type: "label",
                xValue: 5,
                yValue: 200000,
                content: ["Low-risk, immediate revenue", "with minimal additional cost"],
                font: { size: 9, family: "Inter", style: "italic" },
                color: C.textMuted,
              },
            },
          },
        },
        scales: {
          x: baseScaleX,
          y: { ...baseScaleY("Cumulative Revenue"), ticks: { ...baseScaleY("").ticks, callback: v => fmtK(v) } },
        },
      },
    });
  }

  // Initial render
  render();
})();
