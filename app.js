/* ============================================
   CEO PERFORMANCE SUITE — V7 App
   ============================================ */

(function () {
  "use strict";

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
    text: "#F1F5F9",
    textSec: "#94A3B8",
    textMuted: "#64748B",
    gridLine: "rgba(148,163,184,0.07)",
    gridLineBold: "rgba(148,163,184,0.12)",
  };

  // ── Helpers ──
  const $ = (s) => document.querySelector(s);
  const labels = D.map((d) => d.short);
  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const col = (field) => D.map((d) => d[field]);
  const fmt = (v, pre = "$", suf = "") => {
    if (v === undefined || v === null) return "—";
    if (typeof v === "number") {
      if (Math.abs(v) >= 1000) return pre + Math.round(v).toLocaleString() + suf;
      if (Math.abs(v) >= 100) return pre + Math.round(v).toLocaleString() + suf;
      return pre + v.toFixed(2) + suf;
    }
    return String(v);
  };
  const fmtK = (v) => {
    if (Math.abs(v) >= 1e6) return "$" + (v / 1e6).toFixed(1) + "M";
    if (Math.abs(v) >= 1e3) return "$" + (v / 1e3).toFixed(0) + "K";
    return "$" + Math.round(v);
  };
  const fmtNum = (v) => Math.round(v).toLocaleString();
  const fmtPct = (v) => v.toFixed(1) + "%";
  const fmtX = (v) => v.toFixed(2) + "x";

  // Chart instance storage
  let charts = [];
  const destroyCharts = () => {
    charts.forEach((c) => { try { c.destroy(); } catch(e){} });
    charts = [];
  };

  // ── Chart defaults ──
  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.font.size = 11;
  Chart.defaults.color = C.textSec;
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.pointStyleWidth = 8;
  Chart.defaults.plugins.legend.labels.boxHeight = 7;
  Chart.defaults.plugins.legend.labels.padding = 14;
  Chart.defaults.plugins.tooltip.backgroundColor = "rgba(15,23,42,0.95)";
  Chart.defaults.plugins.tooltip.borderColor = "rgba(148,163,184,0.2)";
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.tooltip.titleFont = { weight: "600", size: 12 };
  Chart.defaults.plugins.tooltip.bodyFont = { size: 11 };
  Chart.defaults.elements.bar.borderRadius = 4;
  Chart.defaults.elements.line.tension = 0.35;
  Chart.defaults.elements.point.radius = 0;
  Chart.defaults.elements.point.hoverRadius = 5;
  Chart.defaults.responsive = true;
  Chart.defaults.maintainAspectRatio = true;

  // ── Scale helpers ──
  function makeScaleX() {
    return {
      grid: { color: C.gridLine, drawBorder: false },
      ticks: { maxRotation: 45, font: { size: 10 } },
    };
  }
  function makeScaleY(label, prefix = "$", cb) {
    const s = {
      grid: { color: C.gridLine, drawBorder: false },
      ticks: {
        font: { size: 10 },
        callback: cb || function (v) {
          if (prefix === "$") return fmtK(v);
          if (prefix === "x") return v.toFixed(1) + "x";
          if (prefix === "%") return v + "%";
          return v;
        },
      },
    };
    if (label) s.title = { display: true, text: label, font: { size: 10, weight: "500" }, color: C.textMuted };
    return s;
  }
  function makeScaleYRight(label, prefix, cb) {
    const s = makeScaleY(label, prefix, cb);
    s.position = "right";
    s.grid = { drawOnChartArea: false };
    return s;
  }

  // Gradient helper
  function makeGradient(ctx, color, alpha1 = 0.35, alpha2 = 0) {
    const g = ctx.createLinearGradient(0, 0, 0, ctx.canvas.clientHeight || 300);
    g.addColorStop(0, color.replace(")", `, ${alpha1})`).replace("rgb", "rgba").replace("##", "#"));
    // Safer approach
    const r = parseInt(color.slice(1,3),16), gr = parseInt(color.slice(3,5),16), b = parseInt(color.slice(5,7),16);
    const grd = ctx.createLinearGradient(0, 0, 0, ctx.canvas.clientHeight || 300);
    grd.addColorStop(0, `rgba(${r},${gr},${b},${alpha1})`);
    grd.addColorStop(1, `rgba(${r},${gr},${b},${alpha2})`);
    return grd;
  }

  // Create chart convenience
  function mkChart(canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const ch = new Chart(canvas.getContext("2d"), config);
    charts.push(ch);
    return ch;
  }

  // ── HTML Builders ──
  function kpiHTML(label, value) {
    return `<div class="kpi-card"><div class="kpi-label">${label}</div><div class="kpi-value">${value}</div></div>`;
  }
  function kpiCompareHTML(label, rVal, iVal) {
    return `<div class="kpi-card">
      <div class="kpi-label">${label}</div>
      <div class="kpi-compare">
        <div class="kpi-compare-item"><span class="kpi-compare-label">Rosen</span><span class="kpi-compare-value rosen">${rVal}</span></div>
        <div class="kpi-compare-item"><span class="kpi-compare-label">IIBS</span><span class="kpi-compare-value iibs">${iVal}</span></div>
      </div>
    </div>`;
  }
  function chartCardHTML(id, title, height = 280) {
    return `<div class="chart-card"><div class="chart-card-title">${title}</div><div class="chart-wrap"><canvas id="${id}" height="${height}"></canvas></div></div>`;
  }

  // ──────────────────────────────────────────
  //  DB0: Rosen P&L
  // ──────────────────────────────────────────
  function renderDB0() {
    const pre = "r_";
    const netChurnAvg = avg(col(pre + "net_churn"));
    const netSCAvg = avg(col(pre + "net_sc"));
    const mroiAvg = avg(col(pre + "mroi"));
    const roasAvg = avg(col(pre + "roas"));
    const rphAvg = avg(col(pre + "rph"));

    return `
      <h1 class="db-title">Rosen P&L</h1>
      <div class="kpi-row cols-5">
        ${kpiHTML("Avg Net Rev Post Churn", fmtK(netChurnAvg))}
        ${kpiHTML("Avg Net Rev (S-C)", fmtK(netSCAvg))}
        ${kpiHTML("Avg mROI", fmtX(mroiAvg))}
        ${kpiHTML("Avg ROAS", fmtX(roasAvg))}
        ${kpiHTML("Avg Rev/Hr", "$" + rphAvg.toFixed(0))}
      </div>
      <div class="chart-grid cols-2">
        <div class="span-2">${chartCardHTML("c0a", "Revenue Waterfall — Sales, Net (S-C), Net Post Churn")}</div>
        ${chartCardHTML("c0b", "mROI vs Hours")}
        ${chartCardHTML("c0c", "CPA Trend")}
      </div>`;
  }
  function chartsDB0() {
    // Area: Sales, Net SC, Net Churn
    mkChart("c0a", {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Sales Rev", data: col("r_sales"), borderColor: C.indigo, backgroundColor: function(ctx) { return makeGradient(ctx.chart.ctx, C.indigo, 0.25, 0); }, fill: true, borderWidth: 2 },
          { label: "Net Rev (S-C)", data: col("r_net_sc"), borderColor: C.cyan, backgroundColor: function(ctx) { return makeGradient(ctx.chart.ctx, C.cyan, 0.2, 0); }, fill: true, borderWidth: 2 },
          { label: "Net Rev Post Churn", data: col("r_net_churn"), borderColor: C.amber, backgroundColor: function(ctx) { return makeGradient(ctx.chart.ctx, C.amber, 0.18, 0); }, fill: true, borderWidth: 2 },
        ],
      },
      options: { aspectRatio: 2.8, scales: { x: makeScaleX(), y: makeScaleY() }, plugins: { legend: { position: "top" } } },
    });

    // Dual axis: mROI bars + Hours dashed
    mkChart("c0b", {
      type: "bar",
      data: {
        labels,
        datasets: [
          { label: "mROI", data: col("r_mroi"), backgroundColor: C.indigo + "99", borderColor: C.indigo, borderWidth: 1, yAxisID: "y", order: 2 },
          { type: "line", label: "Hours", data: col("hours"), borderColor: C.amber, borderDash: [6, 3], borderWidth: 2, yAxisID: "y1", order: 1, pointRadius: 0 },
        ],
      },
      options: { aspectRatio: 1.6, scales: { x: makeScaleX(), y: makeScaleY("mROI", "x"), y1: makeScaleYRight("Hours", "", (v) => fmtNum(v)) } },
    });

    // CPA line
    mkChart("c0c", {
      type: "line",
      data: {
        labels,
        datasets: [{ label: "CPA", data: col("r_cpa"), borderColor: C.red, backgroundColor: function(ctx) { return makeGradient(ctx.chart.ctx, C.red, 0.15, 0); }, fill: true, borderWidth: 2 }],
      },
      options: { aspectRatio: 1.6, scales: { x: makeScaleX(), y: makeScaleY("CPA") } },
    });
  }

  // ──────────────────────────────────────────
  //  DB1: IIBS P&L
  // ──────────────────────────────────────────
  function renderDB1() {
    const netChurnAvg = avg(col("i_net_churn"));
    const netSCAvg = avg(col("i_net_sc"));
    const mroiAvg = avg(col("i_mroi"));
    const roasAvg = avg(col("i_roas"));
    const rphAvg = avg(col("i_rph"));

    return `
      <h1 class="db-title">IIBS P&L</h1>
      <div class="kpi-row cols-5">
        ${kpiHTML("Avg Net Rev Post Churn", fmtK(netChurnAvg))}
        ${kpiHTML("Avg Net Rev (S-C)", fmtK(netSCAvg))}
        ${kpiHTML("Avg mROI", fmtX(mroiAvg))}
        ${kpiHTML("Avg ROAS", fmtX(roasAvg))}
        ${kpiHTML("Avg Rev/Hr", "$" + rphAvg.toFixed(0))}
      </div>
      <div class="chart-grid cols-2">
        <div class="span-2">${chartCardHTML("c1a", "Revenue Waterfall — Sales, Net (S-C), Net Post Churn")}</div>
        ${chartCardHTML("c1b", "mROI vs Hours")}
        ${chartCardHTML("c1c", "CPA Trend")}
      </div>`;
  }
  function chartsDB1() {
    mkChart("c1a", {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Sales Rev", data: col("i_sales"), borderColor: C.cyan, backgroundColor: function(ctx) { return makeGradient(ctx.chart.ctx, C.cyan, 0.25, 0); }, fill: true, borderWidth: 2 },
          { label: "Net Rev (S-C)", data: col("i_net_sc"), borderColor: C.indigo, backgroundColor: function(ctx) { return makeGradient(ctx.chart.ctx, C.indigo, 0.2, 0); }, fill: true, borderWidth: 2 },
          { label: "Net Rev Post Churn", data: col("i_net_churn"), borderColor: C.amber, backgroundColor: function(ctx) { return makeGradient(ctx.chart.ctx, C.amber, 0.18, 0); }, fill: true, borderWidth: 2 },
        ],
      },
      options: { aspectRatio: 2.8, scales: { x: makeScaleX(), y: makeScaleY() }, plugins: { legend: { position: "top" } } },
    });
    mkChart("c1b", {
      type: "bar",
      data: {
        labels,
        datasets: [
          { label: "mROI", data: col("i_mroi"), backgroundColor: C.cyan + "99", borderColor: C.cyan, borderWidth: 1, yAxisID: "y", order: 2 },
          { type: "line", label: "Hours", data: col("hours"), borderColor: C.amber, borderDash: [6, 3], borderWidth: 2, yAxisID: "y1", order: 1, pointRadius: 0 },
        ],
      },
      options: { aspectRatio: 1.6, scales: { x: makeScaleX(), y: makeScaleY("mROI", "x"), y1: makeScaleYRight("Hours", "", (v) => fmtNum(v)) } },
    });
    mkChart("c1c", {
      type: "line",
      data: {
        labels,
        datasets: [{ label: "CPA", data: col("i_cpa"), borderColor: C.red, backgroundColor: function(ctx) { return makeGradient(ctx.chart.ctx, C.red, 0.15, 0); }, fill: true, borderWidth: 2 }],
      },
      options: { aspectRatio: 1.6, scales: { x: makeScaleX(), y: makeScaleY("CPA") } },
    });
  }

  // ──────────────────────────────────────────
  //  DB2: Combined View
  // ──────────────────────────────────────────
  function renderDB2() {
    const cNetRev = avg(col("c_net_sc"));
    const cSales = avg(col("c_sales"));
    const cCost = avg(col("c_cost"));
    const hrsAvg = avg(col("hours"));

    return `
      <h1 class="db-title">Combined View</h1>
      <div class="kpi-row cols-4">
        ${kpiHTML("Avg Combined Net Rev", fmtK(cNetRev))}
        ${kpiHTML("Avg Combined Sales", fmtK(cSales))}
        ${kpiHTML("Avg Combined Cost", fmtK(cCost))}
        ${kpiHTML("Avg Hours", fmtNum(hrsAvg))}
      </div>
      <div class="chart-grid cols-2">
        <div class="span-2">${chartCardHTML("c2a", "Stacked Net Revenue — Rosen + IIBS")}</div>
        ${chartCardHTML("c2b", "mROI Comparison")}
        ${chartCardHTML("c2c", "Hours Trend")}
      </div>`;
  }
  function chartsDB2() {
    mkChart("c2a", {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Rosen Net Rev", data: col("r_net_sc"), borderColor: C.indigo, backgroundColor: function(ctx) { return makeGradient(ctx.chart.ctx, C.indigo, 0.3, 0.05); }, fill: true, borderWidth: 2, stack: "stack0" },
          { label: "IIBS Net Rev", data: col("i_net_sc"), borderColor: C.cyan, backgroundColor: function(ctx) { return makeGradient(ctx.chart.ctx, C.cyan, 0.3, 0.05); }, fill: true, borderWidth: 2, stack: "stack0" },
        ],
      },
      options: {
        aspectRatio: 2.8,
        scales: { x: makeScaleX(), y: { ...makeScaleY(), stacked: true } },
        plugins: { legend: { position: "top" }, filler: { propagate: true } },
      },
    });
    mkChart("c2b", {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Rosen mROI", data: col("r_mroi"), borderColor: C.indigo, borderWidth: 2 },
          { label: "IIBS mROI", data: col("i_mroi"), borderColor: C.cyan, borderWidth: 2 },
        ],
      },
      options: { aspectRatio: 1.6, scales: { x: makeScaleX(), y: makeScaleY("mROI", "x") } },
    });
    mkChart("c2c", {
      type: "line",
      data: {
        labels,
        datasets: [{ label: "Hours", data: col("hours"), borderColor: C.amber, backgroundColor: function(ctx) { return makeGradient(ctx.chart.ctx, C.amber, 0.2, 0); }, fill: true, borderWidth: 2 }],
      },
      options: { aspectRatio: 1.6, scales: { x: makeScaleX(), y: makeScaleY("Hours", "", (v) => fmtNum(v)) } },
    });
  }

  // ──────────────────────────────────────────
  //  DB3: Zero-Sum Bandwidth
  // ──────────────────────────────────────────
  function renderDB3() {
    const overlapAvg = avg(col("overlap_count"));
    const rTopAvg = avg(col("r_pct_top"));
    const iTopAvg = avg(col("i_pct_top"));

    return `
      <h1 class="db-title">Zero-Sum Bandwidth</h1>
      <div class="kpi-row cols-3">
        ${kpiHTML("Avg Overlap Reps", overlapAvg.toFixed(1))}
        ${kpiHTML("R Avg % Top Reps", fmtPct(rTopAvg))}
        ${kpiHTML("I Avg % Top Reps", fmtPct(iTopAvg))}
      </div>
      <div class="chart-grid cols-2">
        ${chartCardHTML("c3a", "% Top Reps — Rosen vs IIBS (Inverse Pattern)")}
        ${chartCardHTML("c3b", "Scatter — R% Top vs I% Top")}
        ${chartCardHTML("c3c", "Retry Share — Stacked to 100%")}
        ${chartCardHTML("c3d", "Overlap Count Over Time")}
      </div>`;
  }
  function chartsDB3() {
    mkChart("c3a", {
      type: "bar",
      data: {
        labels,
        datasets: [
          { label: "Rosen % Top", data: col("r_pct_top"), backgroundColor: C.indigo + "CC", borderColor: C.indigo, borderWidth: 1 },
          { label: "IIBS % Top", data: col("i_pct_top"), backgroundColor: C.cyan + "CC", borderColor: C.cyan, borderWidth: 1 },
        ],
      },
      options: { aspectRatio: 1.6, scales: { x: makeScaleX(), y: makeScaleY("% Top", "%") } },
    });

    // Scatter
    const scatterData = D.map((d) => ({ x: d.r_pct_top, y: d.i_pct_top }));
    mkChart("c3b", {
      type: "scatter",
      data: {
        datasets: [{
          label: "R% vs I%",
          data: scatterData,
          backgroundColor: C.indigo + "AA",
          borderColor: C.indigo,
          borderWidth: 1,
          pointRadius: 5,
          pointHoverRadius: 7,
        }],
      },
      options: {
        aspectRatio: 1.6,
        scales: {
          x: { ...makeScaleX(), title: { display: true, text: "Rosen % Top", font: { size: 10 }, color: C.textMuted }, ticks: { callback: (v) => v + "%" } },
          y: { ...makeScaleY("IIBS % Top", "%"), ticks: { callback: (v) => v + "%" } },
        },
      },
    });

    // Stacked area retries
    mkChart("c3c", {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Rosen Retry Share", data: col("r_retry_share"), borderColor: C.indigo, backgroundColor: C.indigo + "55", fill: true, borderWidth: 2 },
          { label: "IIBS Retry Share", data: col("i_retry_share"), borderColor: C.cyan, backgroundColor: C.cyan + "55", fill: true, borderWidth: 2 },
        ],
      },
      options: {
        aspectRatio: 1.6,
        scales: { x: makeScaleX(), y: { ...makeScaleY("", "%"), stacked: true, max: 100 } },
        plugins: { filler: { propagate: true } },
      },
    });

    mkChart("c3d", {
      type: "line",
      data: {
        labels,
        datasets: [{ label: "Overlap Count", data: col("overlap_count"), borderColor: C.amber, backgroundColor: function(ctx) { return makeGradient(ctx.chart.ctx, C.amber, 0.2, 0); }, fill: true, borderWidth: 2 }],
      },
      options: { aspectRatio: 1.6, scales: { x: makeScaleX(), y: { ...makeScaleY("Count", ""), ticks: { stepSize: 1 } } } },
    });
  }

  // ──────────────────────────────────────────
  //  DB4: Fair Context
  // ──────────────────────────────────────────
  function renderDB4() {
    const hrsAvg = avg(col("hours"));
    const shfAvg = avg(col("shifts"));
    const pctAvg = avg(col("r_pct_top"));
    const netAvg = avg(col("r_net_sc"));

    return `
      <h1 class="db-title">Fair Context — Rosen Inputs vs Outputs</h1>
      <div class="kpi-row cols-4">
        ${kpiHTML("Avg Hours", fmtNum(hrsAvg))}
        ${kpiHTML("Avg Shifts", fmtNum(shfAvg))}
        ${kpiHTML("Avg % Top Reps", fmtPct(pctAvg))}
        ${kpiHTML("Avg Net Rev (S-C)", fmtK(netAvg))}
      </div>
      <div class="chart-grid cols-2">
        ${chartCardHTML("c4a", "Hours (Area) + Net Rev Post Churn (Line)")}
        ${chartCardHTML("c4b", "Scatter — Hours vs Net Rev (S-C)")}
        ${chartCardHTML("c4c", "Scatter — % Top Reps vs Net Rev (S-C)")}
        ${chartCardHTML("c4d", "Leads & Retries Trends")}
      </div>`;
  }
  function chartsDB4() {
    mkChart("c4a", {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Hours", data: col("hours"), borderColor: C.cyan, backgroundColor: function(ctx) { return makeGradient(ctx.chart.ctx, C.cyan, 0.25, 0); }, fill: true, borderWidth: 2, yAxisID: "y" },
          { label: "Net Rev Post Churn", data: col("r_net_churn"), borderColor: C.indigo, borderWidth: 2.5, yAxisID: "y1", fill: false },
        ],
      },
      options: {
        aspectRatio: 1.6,
        scales: { x: makeScaleX(), y: makeScaleY("Hours", "", (v) => fmtNum(v)), y1: makeScaleYRight("Net Rev Post Churn") },
      },
    });

    mkChart("c4b", {
      type: "scatter",
      data: {
        datasets: [{
          label: "Hours vs Net Rev",
          data: D.map((d) => ({ x: d.hours, y: d.r_net_sc })),
          backgroundColor: C.indigo + "AA",
          borderColor: C.indigo,
          borderWidth: 1,
          pointRadius: 5,
          pointHoverRadius: 7,
        }],
      },
      options: {
        aspectRatio: 1.6,
        scales: {
          x: { ...makeScaleX(), title: { display: true, text: "Hours", font: { size: 10 }, color: C.textMuted }, ticks: { callback: (v) => fmtNum(v) } },
          y: makeScaleY("Net Rev (S-C)"),
        },
      },
    });

    mkChart("c4c", {
      type: "scatter",
      data: {
        datasets: [{
          label: "% Top vs Net Rev",
          data: D.map((d) => ({ x: d.r_pct_top, y: d.r_net_sc })),
          backgroundColor: C.emerald + "AA",
          borderColor: C.emerald,
          borderWidth: 1,
          pointRadius: 5,
          pointHoverRadius: 7,
        }],
      },
      options: {
        aspectRatio: 1.6,
        scales: {
          x: { ...makeScaleX(), title: { display: true, text: "% Top Reps", font: { size: 10 }, color: C.textMuted }, ticks: { callback: (v) => v + "%" } },
          y: makeScaleY("Net Rev (S-C)"),
        },
      },
    });

    mkChart("c4d", {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Leads", data: col("r_leads"), borderColor: C.amber, borderWidth: 2, yAxisID: "y" },
          { label: "Retries", data: col("r_retries"), borderColor: C.red, borderWidth: 2, yAxisID: "y1" },
        ],
      },
      options: {
        aspectRatio: 1.6,
        scales: {
          x: makeScaleX(),
          y: { ...makeScaleY("Leads", ""), ticks: { callback: (v) => fmtNum(v) } },
          y1: { ...makeScaleYRight("Retries", ""), ticks: { callback: (v) => fmtNum(v) } },
        },
      },
    });
  }

  // ──────────────────────────────────────────
  //  DB5: CEO Strategic Overview
  // ──────────────────────────────────────────
  function renderDB5() {
    const rNetAvg = avg(col("r_net_sc")), iNetAvg = avg(col("i_net_sc"));
    const rMroiAvg = avg(col("r_mroi")), iMroiAvg = avg(col("i_mroi"));
    const rRoasAvg = avg(col("r_roas")), iRoasAvg = avg(col("i_roas"));
    const rRphAvg = avg(col("r_rph")), iRphAvg = avg(col("i_rph"));
    const rSalesAvg = avg(col("r_sales")), iSalesAvg = avg(col("i_sales"));
    const rCostAvg = avg(col("r_cost")), iCostAvg = avg(col("i_cost"));

    return `
      <h1 class="db-title">CEO Strategic Overview</h1>
      <div class="kpi-row cols-6">
        ${kpiCompareHTML("Net Rev (S-C)", fmtK(rNetAvg), fmtK(iNetAvg))}
        ${kpiCompareHTML("mROI", fmtX(rMroiAvg), fmtX(iMroiAvg))}
        ${kpiCompareHTML("ROAS", fmtX(rRoasAvg), fmtX(iRoasAvg))}
        ${kpiCompareHTML("Rev/Hr", "$" + rRphAvg.toFixed(0), "$" + iRphAvg.toFixed(0))}
        ${kpiCompareHTML("Sales Rev", fmtK(rSalesAvg), fmtK(iSalesAvg))}
        ${kpiCompareHTML("Cost", fmtK(rCostAvg), fmtK(iCostAvg))}
      </div>
      <div class="chart-grid cols-2">
        ${chartCardHTML("c5a", "Net Rev (S-C) — R vs I")}
        ${chartCardHTML("c5b", "mROI — R vs I")}
        ${chartCardHTML("c5c", "Sales Rev — R vs I")}
        ${chartCardHTML("c5d", "Cost — R vs I")}
      </div>`;
  }
  function chartsDB5() {
    const dualLine = (id, rField, iField, yLabel, yPre) => {
      mkChart(id, {
        type: "line",
        data: {
          labels,
          datasets: [
            { label: "Rosen", data: col(rField), borderColor: C.indigo, borderWidth: 2 },
            { label: "IIBS", data: col(iField), borderColor: C.cyan, borderWidth: 2 },
          ],
        },
        options: { aspectRatio: 1.6, scales: { x: makeScaleX(), y: makeScaleY(yLabel, yPre) } },
      });
    };
    dualLine("c5a", "r_net_sc", "i_net_sc", "Net Rev", "$");
    dualLine("c5b", "r_mroi", "i_mroi", "mROI", "x");
    dualLine("c5c", "r_sales", "i_sales", "Sales Rev", "$");
    dualLine("c5d", "r_cost", "i_cost", "Cost", "$");
  }

  // ──────────────────────────────────────────
  //  DB6: Top Reps Correlation
  // ──────────────────────────────────────────
  let db6SubTab = "rosen";

  function renderDB6() {
    return `
      <h1 class="db-title">Top Reps Correlation</h1>
      <div class="sub-tabs" id="db6Tabs">
        <button class="sub-tab ${db6SubTab === "rosen" ? "active" : ""}" data-sub="rosen">Rosen</button>
        <button class="sub-tab ${db6SubTab === "iibs" ? "active" : ""}" data-sub="iibs">IIBS</button>
      </div>
      <div id="db6Content"></div>`;
  }

  function renderDB6Content() {
    const isR = db6SubTab === "rosen";
    const pctField = isR ? "r_pct_top" : "i_pct_top";
    const netField = isR ? "r_net_sc" : "i_net_sc";
    const threshold = isR ? 65 : 50;
    const pctData = col(pctField);
    const netData = col(netField);

    const avgPct = avg(pctData);
    const above = D.filter((d) => d[pctField] >= threshold);
    const below = D.filter((d) => d[pctField] < threshold);
    const aboveAvg = above.length ? avg(above.map((d) => d[netField])) : 0;
    const belowAvg = below.length ? avg(below.map((d) => d[netField])) : 0;
    const delta = aboveAvg - belowAvg;

    // Top 10 months by net rev
    const sorted = D.slice().sort((a, b) => b[netField] - a[netField]).slice(0, 10);

    const container = document.getElementById("db6Content");
    container.innerHTML = `
      <div class="kpi-row cols-5">
        ${kpiHTML("Avg % Top Reps", fmtPct(avgPct))}
        ${kpiHTML("Months Above " + threshold + "%", String(above.length))}
        ${kpiHTML("Avg Rev When High", fmtK(aboveAvg))}
        ${kpiHTML("Avg Rev When Low", fmtK(belowAvg))}
        ${kpiHTML("Delta", fmtK(delta))}
      </div>
      <div class="chart-grid cols-2">
        <div class="span-2">${chartCardHTML("c6a", "% Top Reps (Area) + Net Rev (S-C) (Line)")}</div>
        ${chartCardHTML("c6b", "Scatter — % Top Reps vs Net Rev (S-C)")}
        ${chartCardHTML("c6c", "Top 10 Months by Net Rev")}
      </div>`;

    // Charts
    const accentColor = isR ? C.indigo : C.cyan;

    mkChart("c6a", {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "% Top Reps", data: pctData, borderColor: C.cyan, backgroundColor: function(ctx) { return makeGradient(ctx.chart.ctx, C.cyan, 0.25, 0); }, fill: true, borderWidth: 2, yAxisID: "y" },
          { label: "Net Rev (S-C)", data: netData, borderColor: accentColor, borderWidth: 2.5, yAxisID: "y1", fill: false },
        ],
      },
      options: {
        aspectRatio: 2.8,
        scales: { x: makeScaleX(), y: makeScaleY("% Top", "%"), y1: makeScaleYRight("Net Rev (S-C)") },
      },
    });

    mkChart("c6b", {
      type: "scatter",
      data: {
        datasets: [{
          label: "% Top vs Net Rev",
          data: D.map((d) => ({ x: d[pctField], y: d[netField] })),
          backgroundColor: accentColor + "AA",
          borderColor: accentColor,
          borderWidth: 1,
          pointRadius: 5,
          pointHoverRadius: 7,
        }],
      },
      options: {
        aspectRatio: 1.6,
        scales: {
          x: { ...makeScaleX(), title: { display: true, text: "% Top Reps", font: { size: 10 }, color: C.textMuted }, ticks: { callback: (v) => v + "%" } },
          y: makeScaleY("Net Rev (S-C)"),
        },
      },
    });

    // Horizontal bar top 10
    mkChart("c6c", {
      type: "bar",
      data: {
        labels: sorted.map((d) => d.short + " (" + d[pctField].toFixed(0) + "%)"),
        datasets: [{
          label: "Net Rev (S-C)",
          data: sorted.map((d) => d[netField]),
          backgroundColor: sorted.map((d) => d[pctField] >= threshold ? C.emerald + "CC" : C.amber + "CC"),
          borderColor: sorted.map((d) => d[pctField] >= threshold ? C.emerald : C.amber),
          borderWidth: 1,
        }],
      },
      options: {
        indexAxis: "y",
        aspectRatio: 1.4,
        scales: {
          x: makeScaleY("Net Rev (S-C)"),
          y: { ticks: { font: { size: 10 } }, grid: { display: false } },
        },
        plugins: { legend: { display: false } },
      },
    });
  }

  // ──────────────────────────────────────────
  //  DB7: Monthly Intelligence Briefing
  // ──────────────────────────────────────────
  let db7SubTab = "rosen";

  function renderDB7() {
    return `
      <h1 class="db-title">Monthly Intelligence Briefing</h1>
      <div class="sub-tabs" id="db7Tabs">
        <button class="sub-tab ${db7SubTab === "rosen" ? "active" : ""}" data-sub="rosen">Rosen</button>
        <button class="sub-tab ${db7SubTab === "iibs" ? "active" : ""}" data-sub="iibs">IIBS</button>
        <button class="sub-tab ${db7SubTab === "combined" ? "active" : ""}" data-sub="combined">Combined</button>
      </div>
      <div id="db7Content"></div>`;
  }

  function renderDB7Content() {
    let netField, mroiField, roasField, labelName;
    if (db7SubTab === "rosen") { netField = "r_net_churn"; mroiField = "r_mroi"; roasField = "r_roas"; labelName = "Rosen"; }
    else if (db7SubTab === "iibs") { netField = "i_net_churn"; mroiField = "i_mroi"; roasField = "i_roas"; labelName = "IIBS"; }
    else { netField = "c_net_sc"; mroiField = "r_mroi"; roasField = "r_roas"; labelName = "Combined"; }

    const netData = col(netField);
    const avgVal = avg(netData);
    const maxIdx = netData.indexOf(Math.max(...netData));
    const minIdx = netData.indexOf(Math.min(...netData));
    const last3 = avg(netData.slice(-3));
    const prior3 = avg(netData.slice(-6, -3));
    const trendPct = ((last3 - prior3) / prior3 * 100);

    const container = document.getElementById("db7Content");
    container.innerHTML = `
      <div class="kpi-row cols-4">
        ${kpiHTML("Best Month", D[maxIdx].short + " — " + fmtK(netData[maxIdx]))}
        ${kpiHTML("Worst Month", D[minIdx].short + " — " + fmtK(netData[minIdx]))}
        ${kpiHTML("26-Month Avg", fmtK(avgVal))}
        ${kpiHTML("Trend (L3 vs P3)", (trendPct >= 0 ? "+" : "") + trendPct.toFixed(1) + "%")}
      </div>
      <div class="chart-grid cols-2">
        <div class="span-2">${chartCardHTML("c7a", labelName + " — Net Rev Post Churn 26-Month Trend")}</div>
        ${chartCardHTML("c7b", "mROI & ROAS")}
        ${chartCardHTML("c7c", "All 26 Months — Sorted by Net Rev")}
      </div>`;

    const accentColor = db7SubTab === "iibs" ? C.cyan : C.indigo;

    mkChart("c7a", {
      type: "line",
      data: {
        labels,
        datasets: [{ label: "Net Rev Post Churn", data: netData, borderColor: accentColor, backgroundColor: function(ctx) { return makeGradient(ctx.chart.ctx, accentColor, 0.2, 0); }, fill: true, borderWidth: 2 }],
      },
      options: { aspectRatio: 2.8, scales: { x: makeScaleX(), y: makeScaleY() }, plugins: { legend: { display: false } } },
    });

    if (db7SubTab !== "combined") {
      mkChart("c7b", {
        type: "line",
        data: {
          labels,
          datasets: [
            { label: "mROI", data: col(mroiField), borderColor: C.amber, borderWidth: 2 },
            { label: "ROAS", data: col(roasField), borderColor: C.emerald, borderWidth: 2 },
          ],
        },
        options: { aspectRatio: 1.6, scales: { x: makeScaleX(), y: makeScaleY("", "x") } },
      });
    } else {
      // Combined: show R mROI vs I mROI
      mkChart("c7b", {
        type: "line",
        data: {
          labels,
          datasets: [
            { label: "R mROI", data: col("r_mroi"), borderColor: C.indigo, borderWidth: 2 },
            { label: "I mROI", data: col("i_mroi"), borderColor: C.cyan, borderWidth: 2 },
          ],
        },
        options: { aspectRatio: 1.6, scales: { x: makeScaleX(), y: makeScaleY("mROI", "x") } },
      });
    }

    // Sorted horizontal bars
    const sorted = D.slice().map((d, i) => ({ label: d.short, val: netData[i] })).sort((a, b) => b.val - a.val);
    const maxVal = sorted[0].val;
    const minVal = sorted[sorted.length - 1].val;
    const barColors = sorted.map((d) => {
      const ratio = (d.val - minVal) / (maxVal - minVal || 1);
      // Green to red gradient
      const r = Math.round(239 * (1 - ratio) + 16 * ratio);
      const g = Math.round(68 * (1 - ratio) + 185 * ratio);
      const b = Math.round(68 * (1 - ratio) + 129 * ratio);
      return `rgba(${r},${g},${b},0.8)`;
    });

    mkChart("c7c", {
      type: "bar",
      data: {
        labels: sorted.map((d) => d.label),
        datasets: [{
          label: "Net Rev",
          data: sorted.map((d) => d.val),
          backgroundColor: barColors,
          borderWidth: 0,
        }],
      },
      options: {
        indexAxis: "y",
        aspectRatio: 0.8,
        scales: {
          x: makeScaleY(""),
          y: { ticks: { font: { size: 10 } }, grid: { display: false } },
        },
        plugins: { legend: { display: false } },
      },
    });
  }

  // ──────────────────────────────────────────
  //  Dashboard Registry
  // ──────────────────────────────────────────
  const dbRenderers = [renderDB0, renderDB1, renderDB2, renderDB3, renderDB4, renderDB5, renderDB6, renderDB7];
  const dbCharters = [chartsDB0, chartsDB1, chartsDB2, chartsDB3, chartsDB4, chartsDB5, chartsDB6, chartsDB7];

  // For DB6 and DB7 we need to render inner content after main render
  function chartsDB6() { renderDB6Content(); }
  function chartsDB7() { renderDB7Content(); }
  dbCharters[6] = chartsDB6;
  dbCharters[7] = chartsDB7;

  // ──────────────────────────────────────────
  //  Navigation
  // ──────────────────────────────────────────
  let activeDB = 0;

  function switchDB(idx) {
    if (idx === activeDB && document.getElementById("dashboardContainer").children.length > 0) return;
    activeDB = idx;

    // Update nav
    document.querySelectorAll(".nav-item").forEach((btn, i) => {
      btn.classList.toggle("active", i === idx);
    });

    destroyCharts();
    const container = $("#dashboardContainer");
    container.innerHTML = `<div class="dashboard-view">${dbRenderers[idx]()}</div>`;
    dbCharters[idx]();

    // Wire sub-tabs for DB6
    if (idx === 6) {
      document.getElementById("db6Tabs").addEventListener("click", (e) => {
        const sub = e.target.dataset.sub;
        if (!sub || sub === db6SubTab) return;
        db6SubTab = sub;
        document.querySelectorAll("#db6Tabs .sub-tab").forEach((b) => b.classList.toggle("active", b.dataset.sub === sub));
        // Re-render content portion only, destroy those charts
        destroyCharts();
        renderDB6Content();
      });
    }

    // Wire sub-tabs for DB7
    if (idx === 7) {
      document.getElementById("db7Tabs").addEventListener("click", (e) => {
        const sub = e.target.dataset.sub;
        if (!sub || sub === db7SubTab) return;
        db7SubTab = sub;
        document.querySelectorAll("#db7Tabs .sub-tab").forEach((b) => b.classList.toggle("active", b.dataset.sub === sub));
        destroyCharts();
        renderDB7Content();
      });
    }

    // Close mobile sidebar
    closeMobileSidebar();
  }

  // ── Sidebar events ──
  document.getElementById("sidebarNav").addEventListener("click", (e) => {
    const btn = e.target.closest(".nav-item");
    if (!btn) return;
    switchDB(parseInt(btn.dataset.db));
  });

  // ── Mobile sidebar ──
  function openMobileSidebar() {
    $("#sidebar").classList.add("open");
    $("#sidebarOverlay").classList.add("active");
  }
  function closeMobileSidebar() {
    $("#sidebar").classList.remove("open");
    $("#sidebarOverlay").classList.remove("active");
  }
  $("#menuToggle").addEventListener("click", openMobileSidebar);
  $("#sidebarOverlay").addEventListener("click", closeMobileSidebar);

  // ── Init ──
  switchDB(0);

})();
