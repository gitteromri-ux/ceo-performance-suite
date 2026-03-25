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
  let activeDb = 0;
  let activeSubTab = 0;
  const navItems = document.querySelectorAll(".nav-item");
  const container = $("#dashboardContainer");

  navItems.forEach((btn) => {
    btn.addEventListener("click", () => {
      const db = parseInt(btn.dataset.db);
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
  }

  // Initial render
  render();
})();
