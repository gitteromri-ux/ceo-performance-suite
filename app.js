/* ============================================
   CEO PERFORMANCE SUITE — V8 App
   All 8 dashboards, 6+ charts each
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
    purple: "#A855F7",
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
  const fmtK = (v) => {
    if (v === undefined || v === null) return "—";
    if (Math.abs(v) >= 1e6) return "$" + (v / 1e6).toFixed(1) + "M";
    if (Math.abs(v) >= 1e3) return "$" + (v / 1e3).toFixed(0) + "K";
    return "$" + Math.round(v);
  };
  const fmtDollar = (v) => "$" + Math.round(v).toLocaleString();
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
  function makeScaleY(label, prefix, cb) {
    prefix = prefix || "$";
    const s = {
      grid: { color: C.gridLine, drawBorder: false },
      ticks: {
        font: { size: 10 },
        callback: cb || function (v) {
          if (prefix === "$") return fmtK(v);
          if (prefix === "x") return v.toFixed(1) + "x";
          if (prefix === "%") return v + "%";
          return v.toLocaleString();
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
  function makeGradient(ctx, hexColor, alpha1, alpha2) {
    alpha1 = alpha1 || 0.35;
    alpha2 = alpha2 !== undefined ? alpha2 : 0;
    const r = parseInt(hexColor.slice(1,3),16), g = parseInt(hexColor.slice(3,5),16), b = parseInt(hexColor.slice(5,7),16);
    const grd = ctx.createLinearGradient(0, 0, 0, ctx.canvas.clientHeight || 300);
    grd.addColorStop(0, "rgba(" + r + "," + g + "," + b + "," + alpha1 + ")");
    grd.addColorStop(1, "rgba(" + r + "," + g + "," + b + "," + alpha2 + ")");
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
    return '<div class="kpi-card"><div class="kpi-label">' + label + '</div><div class="kpi-value">' + value + '</div></div>';
  }
  function kpiCompareHTML(label, rVal, iVal) {
    return '<div class="kpi-card"><div class="kpi-label">' + label + '</div><div class="kpi-compare"><div class="kpi-compare-item"><span class="kpi-compare-label">Rosen</span><span class="kpi-compare-value rosen">' + rVal + '</span></div><div class="kpi-compare-item"><span class="kpi-compare-label">IIBS</span><span class="kpi-compare-value iibs">' + iVal + '</span></div></div></div>';
  }
  function chartCardHTML(id, title, height) {
    height = height || 280;
    return '<div class="chart-card"><div class="chart-card-title">' + title + '</div><div class="chart-wrap"><canvas id="' + id + '" height="' + height + '"></canvas></div></div>';
  }

  // ── Table Builder ──
  function tableHTML(title, headers, rows, options) {
    options = options || {};
    var cyanCol = options.cyanCol; // column index for cyan highlight
    var repNamesCol = options.repNamesCol; // column index for rep names
    var html = '<div class="data-table-card"><div class="chart-card-title">' + title + '</div><div class="data-table-wrap"><table class="data-table"><thead><tr>';
    headers.forEach(function(h) { html += '<th>' + h + '</th>'; });
    html += '</tr></thead><tbody>';
    rows.forEach(function(row) {
      html += '<tr>';
      row.forEach(function(cell, ci) {
        var cls = '';
        if (ci === cyanCol) cls = ' class="cyan-highlight"';
        else if (ci === repNamesCol) cls = ' class="rep-names"';
        html += '<td' + cls + '>' + cell + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table></div></div>';
    return html;
  }

  // ══════════════════════════════════════════════
  //  SCHOOL DASHBOARD BUILDER (DB0 Rosen, DB1 IIBS)
  // ══════════════════════════════════════════════
  function renderSchoolDB(pre, schoolName) {
    var netChurnAvg = avg(col(pre + "net_churn"));
    var netSCAvg = avg(col(pre + "net_sc"));
    var mroiAvg = avg(col(pre + "mroi"));
    var roasAvg = avg(col(pre + "roas"));
    var rphAvg = avg(col(pre + "rph"));
    var hoursAvg = avg(col("hours"));

    // Build table rows
    var tableRows = D.map(function(d) {
      return [
        d.short,
        fmtDollar(d[pre + "net_churn"]),
        fmtDollar(d[pre + "net_sc"]),
        fmtX(d[pre + "mroi"]),
        fmtX(d[pre + "roas"]),
        "$" + d[pre + "rph"].toFixed(1),
        fmtNum(d.hours),
        fmtNum(d.shifts),
        fmtDollar(d[pre + "sales"]),
        fmtDollar(d[pre + "stat_rev"]),
        fmtDollar(d[pre + "cost"]),
        "$" + Math.round(d[pre + "cpa"]),
        "$" + d[pre + "cpl"].toFixed(1),
        fmtNum(d[pre + "acq"]),
        d[pre + "conv"].toFixed(1) + "%",
        fmtNum(d[pre + "leads"]),
        fmtNum(d[pre + "retries"])
      ];
    });

    var uid = pre === "r_" ? "r" : "i";

    return '<h1 class="db-title">' + schoolName + ' — Full Monthly Performance</h1>' +
      '<div class="kpi-row cols-6">' +
        kpiHTML("Avg Net Rev Post Churn", fmtK(netChurnAvg)) +
        kpiHTML("Avg Net Rev (S-C)", fmtK(netSCAvg)) +
        kpiHTML("Avg mROI", fmtX(mroiAvg)) +
        kpiHTML("Avg ROAS", fmtX(roasAvg)) +
        kpiHTML("Avg Rev/Hr", "$" + rphAvg.toFixed(0)) +
        kpiHTML("Avg Hours", fmtNum(hoursAvg)) +
      '</div>' +
      '<div class="chart-grid cols-2">' +
        '<div class="span-2">' + chartCardHTML(uid + "c1", "Revenue Waterfall — Sales Rev, Net (S-C), Net Post Churn") + '</div>' +
        chartCardHTML(uid + "c2", "mROI & ROAS — 26-Month Trend") +
        chartCardHTML(uid + "c3", "Hours & Shifts vs Rev/Hr") +
        chartCardHTML(uid + "c4", "Acquisitions & Conversion Rate") +
        chartCardHTML(uid + "c5", "Cost Efficiency — Media Cost, CPA, CPL") +
        chartCardHTML(uid + "c6", "Leads & Retries") +
        chartCardHTML(uid + "c7", "Stat CRM Rev vs Sales Rev") +
      '</div>' +
      tableHTML("Monthly Summary — All " + schoolName + " Metrics",
        ["Month","Net Rev Post Churn","Net Rev (S-C)","mROI","ROAS","Rev/Hr","Hours","Shifts","Sales Rev","Stat Rev","Cost","CPA","CPL","Acq","Conv%","Leads","Retries"],
        tableRows
      );
  }

  function chartsSchoolDB(pre) {
    var uid = pre === "r_" ? "r" : "i";
    var accentA = pre === "r_" ? C.indigo : C.cyan;
    var accentB = pre === "r_" ? C.cyan : C.indigo;

    // 1. Revenue Waterfall — 3 area lines
    mkChart(uid + "c1", {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          { label: "Sales Rev", data: col(pre + "sales"), borderColor: accentA, backgroundColor: function(ctx) { return makeGradient(ctx.chart.ctx, accentA, 0.25, 0); }, fill: true, borderWidth: 2 },
          { label: "Net Rev (S-C)", data: col(pre + "net_sc"), borderColor: accentB, backgroundColor: function(ctx) { return makeGradient(ctx.chart.ctx, accentB, 0.2, 0); }, fill: true, borderWidth: 2 },
          { label: "Net Rev Post Churn", data: col(pre + "net_churn"), borderColor: C.amber, backgroundColor: function(ctx) { return makeGradient(ctx.chart.ctx, C.amber, 0.18, 0); }, fill: true, borderWidth: 2 },
        ],
      },
      options: { aspectRatio: 2.8, scales: { x: makeScaleX(), y: makeScaleY(null, "$") }, plugins: { legend: { position: "top" } } },
    });

    // 2. mROI & ROAS dual line
    mkChart(uid + "c2", {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          { label: "mROI", data: col(pre + "mroi"), borderColor: accentA, borderWidth: 2 },
          { label: "ROAS", data: col(pre + "roas"), borderColor: C.amber, borderWidth: 2 },
        ],
      },
      options: { aspectRatio: 1.6, scales: { x: makeScaleX(), y: makeScaleY(null, "x") } },
    });

    // 3. Hours & Shifts bars + Rev/Hr line
    mkChart(uid + "c3", {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          { label: "Hours", data: col("hours"), backgroundColor: accentA + "88", borderColor: accentA, borderWidth: 1, yAxisID: "y", order: 2 },
          { label: "Shifts", data: col("shifts"), backgroundColor: C.amber + "66", borderColor: C.amber, borderWidth: 1, yAxisID: "y", order: 3 },
          { type: "line", label: "Rev/Hr", data: col(pre + "rph"), borderColor: C.emerald, borderWidth: 2.5, yAxisID: "y1", order: 1, pointRadius: 0 },
        ],
      },
      options: {
        aspectRatio: 1.6,
        scales: {
          x: makeScaleX(),
          y: makeScaleY("Hours / Shifts", "", function(v) { return fmtNum(v); }),
          y1: makeScaleYRight("Rev/Hr", "$"),
        },
      },
    });

    // 4. Acquisitions & Conversion — dual axis
    mkChart(uid + "c4", {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          { label: "Acquisitions", data: col(pre + "acq"), backgroundColor: accentA + "99", borderColor: accentA, borderWidth: 1, yAxisID: "y", order: 2 },
          { type: "line", label: "Conv%", data: col(pre + "conv"), borderColor: C.emerald, borderWidth: 2.5, yAxisID: "y1", order: 1, pointRadius: 0 },
        ],
      },
      options: {
        aspectRatio: 1.6,
        scales: {
          x: makeScaleX(),
          y: makeScaleY("Acquisitions", "", function(v) { return fmtNum(v); }),
          y1: makeScaleYRight("Conv%", "%"),
        },
      },
    });

    // 5. Cost Efficiency — Cost bars + CPA line + CPL line
    mkChart(uid + "c5", {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          { label: "Media Cost", data: col(pre + "cost"), backgroundColor: C.red + "55", borderColor: C.red, borderWidth: 1, yAxisID: "y", order: 3 },
          { type: "line", label: "CPA", data: col(pre + "cpa"), borderColor: C.amber, borderWidth: 2, yAxisID: "y1", order: 1, pointRadius: 0 },
          { type: "line", label: "CPL", data: col(pre + "cpl"), borderColor: C.emerald, borderWidth: 2, yAxisID: "y1", order: 2, pointRadius: 0, borderDash: [5, 3] },
        ],
      },
      options: {
        aspectRatio: 1.6,
        scales: {
          x: makeScaleX(),
          y: makeScaleY("Media Cost", "$"),
          y1: makeScaleYRight("CPA / CPL", "$"),
        },
      },
    });

    // 6. Leads & Retries — dual axis
    mkChart(uid + "c6", {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          { label: "Leads", data: col(pre + "leads"), backgroundColor: accentB + "88", borderColor: accentB, borderWidth: 1, yAxisID: "y", order: 2 },
          { type: "line", label: "Retries", data: col(pre + "retries"), borderColor: C.red, borderWidth: 2, yAxisID: "y1", order: 1, pointRadius: 0 },
        ],
      },
      options: {
        aspectRatio: 1.6,
        scales: {
          x: makeScaleX(),
          y: makeScaleY("Leads", "", function(v) { return fmtNum(v); }),
          y1: makeScaleYRight("Retries", "", function(v) { return fmtNum(v); }),
        },
      },
    });

    // 7. Stat CRM Rev vs Sales Rev
    mkChart(uid + "c7", {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          { label: "Sales Rev", data: col(pre + "sales"), borderColor: accentA, borderWidth: 2 },
          { label: "Stat CRM Rev", data: col(pre + "stat_rev"), borderColor: C.purple, borderWidth: 2, borderDash: [6, 3] },
        ],
      },
      options: { aspectRatio: 1.6, scales: { x: makeScaleX(), y: makeScaleY(null, "$") } },
    });
  }

  // DB0: Rosen
  function renderDB0() { return renderSchoolDB("r_", "Rosen"); }
  function chartsDB0() { chartsSchoolDB("r_"); }

  // DB1: IIBS
  function renderDB1() { return renderSchoolDB("i_", "IIBS"); }
  function chartsDB1() { chartsSchoolDB("i_"); }

  // ══════════════════════════════════════════════
  //  DB2: Combined — Both Schools
  // ══════════════════════════════════════════════
  function renderDB2() {
    var cNetRev = avg(col("c_net_sc"));
    var cSales = avg(col("c_sales"));
    var cCost = avg(col("c_cost"));
    var hrsAvg = avg(col("hours"));
    var shfAvg = avg(col("shifts"));

    // Combined summary table
    var tblRows = D.map(function(d) {
      return [
        d.short,
        fmtDollar(d.r_net_sc),
        fmtDollar(d.i_net_sc),
        fmtDollar(d.c_net_sc),
        fmtX(d.r_mroi),
        fmtX(d.i_mroi),
        fmtDollar(d.r_sales),
        fmtDollar(d.i_sales),
        fmtNum(d.hours),
        fmtNum(d.shifts)
      ];
    });

    return '<h1 class="db-title">Combined — Both Schools</h1>' +
      '<div class="kpi-row cols-5">' +
        kpiHTML("Combined Net Rev (S-C)", fmtK(cNetRev)) +
        kpiHTML("Combined Sales Rev", fmtK(cSales)) +
        kpiHTML("Combined Cost", fmtK(cCost)) +
        kpiHTML("Avg Hours", fmtNum(hrsAvg)) +
        kpiHTML("Avg Shifts", fmtNum(shfAvg)) +
      '</div>' +
      '<div class="chart-grid cols-2">' +
        '<div class="span-2">' + chartCardHTML("cb1", "Stacked Net Revenue — Rosen + IIBS") + '</div>' +
        '<div class="span-2">' + chartCardHTML("cb2", "Stacked Sales Revenue — Rosen + IIBS") + '</div>' +
        chartCardHTML("cb3", "mROI Comparison — R vs I") +
        chartCardHTML("cb4", "ROAS Comparison — R vs I") +
        chartCardHTML("cb5", "Cost Comparison — R vs I") +
        chartCardHTML("cb6", "Hours & Shifts Trend") +
      '</div>' +
      tableHTML("Combined Summary — All Months",
        ["Month","R Net Rev","I Net Rev","Combined","R mROI","I mROI","R Sales","I Sales","Hours","Shifts"],
        tblRows
      );
  }
  function chartsDB2() {
    // 1. Stacked Net Rev
    mkChart("cb1", {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          { label: "Rosen Net Rev", data: col("r_net_sc"), borderColor: C.indigo, backgroundColor: function(ctx) { return makeGradient(ctx.chart.ctx, C.indigo, 0.3, 0.05); }, fill: true, borderWidth: 2 },
          { label: "IIBS Net Rev", data: col("i_net_sc"), borderColor: C.cyan, backgroundColor: function(ctx) { return makeGradient(ctx.chart.ctx, C.cyan, 0.3, 0.05); }, fill: true, borderWidth: 2 },
        ],
      },
      options: {
        aspectRatio: 2.8,
        scales: { x: makeScaleX(), y: { ...makeScaleY(null, "$"), stacked: true } },
        plugins: { legend: { position: "top" }, filler: { propagate: true } },
      },
    });

    // 2. Stacked Sales Rev
    mkChart("cb2", {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          { label: "Rosen Sales", data: col("r_sales"), borderColor: C.indigo, backgroundColor: function(ctx) { return makeGradient(ctx.chart.ctx, C.indigo, 0.25, 0.05); }, fill: true, borderWidth: 2 },
          { label: "IIBS Sales", data: col("i_sales"), borderColor: C.cyan, backgroundColor: function(ctx) { return makeGradient(ctx.chart.ctx, C.cyan, 0.25, 0.05); }, fill: true, borderWidth: 2 },
        ],
      },
      options: {
        aspectRatio: 2.8,
        scales: { x: makeScaleX(), y: { ...makeScaleY(null, "$"), stacked: true } },
        plugins: { legend: { position: "top" }, filler: { propagate: true } },
      },
    });

    // 3. mROI comparison
    mkChart("cb3", {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          { label: "Rosen mROI", data: col("r_mroi"), borderColor: C.indigo, borderWidth: 2 },
          { label: "IIBS mROI", data: col("i_mroi"), borderColor: C.cyan, borderWidth: 2 },
        ],
      },
      options: { aspectRatio: 1.6, scales: { x: makeScaleX(), y: makeScaleY("mROI", "x") } },
    });

    // 4. ROAS comparison
    mkChart("cb4", {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          { label: "Rosen ROAS", data: col("r_roas"), borderColor: C.indigo, borderWidth: 2 },
          { label: "IIBS ROAS", data: col("i_roas"), borderColor: C.cyan, borderWidth: 2 },
        ],
      },
      options: { aspectRatio: 1.6, scales: { x: makeScaleX(), y: makeScaleY("ROAS", "x") } },
    });

    // 5. Cost comparison
    mkChart("cb5", {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          { label: "Rosen Cost", data: col("r_cost"), borderColor: C.indigo, borderWidth: 2 },
          { label: "IIBS Cost", data: col("i_cost"), borderColor: C.cyan, borderWidth: 2 },
        ],
      },
      options: { aspectRatio: 1.6, scales: { x: makeScaleX(), y: makeScaleY("Cost", "$") } },
    });

    // 6. Hours & Shifts — dual axis
    mkChart("cb6", {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          { label: "Hours", data: col("hours"), backgroundColor: C.indigo + "88", borderColor: C.indigo, borderWidth: 1, yAxisID: "y", order: 2 },
          { type: "line", label: "Shifts", data: col("shifts"), borderColor: C.amber, borderWidth: 2, yAxisID: "y1", order: 1, pointRadius: 0 },
        ],
      },
      options: {
        aspectRatio: 1.6,
        scales: {
          x: makeScaleX(),
          y: makeScaleY("Hours", "", function(v) { return fmtNum(v); }),
          y1: makeScaleYRight("Shifts", "", function(v) { return fmtNum(v); }),
        },
      },
    });
  }

  // ══════════════════════════════════════════════
  //  DB3: Zero-Sum — Shared Rep Bandwidth
  // ══════════════════════════════════════════════
  function renderDB3() {
    var overlapAvg = avg(col("overlap_count"));
    var rTopAvg = avg(col("r_pct_top"));
    var iTopAvg = avg(col("i_pct_top"));
    var gapAvg = avg(D.map(function(d) { return Math.abs(d.r_pct_top - d.i_pct_top); }));

    // Table rows
    var tblRows = D.map(function(d) {
      return [
        d.short,
        fmtNum(d.hours),
        fmtNum(d.shifts),
        fmtPct(d.r_pct_top),
        fmtPct(d.i_pct_top),
        fmtPct(Math.abs(d.r_pct_top - d.i_pct_top)),
        fmtDollar(d.r_net_sc),
        fmtDollar(d.i_net_sc),
        String(d.overlap_count),
        (d.overlap_names || []).join(", ") || "—"
      ];
    });

    return '<h1 class="db-title">Zero-Sum — Shared Rep Bandwidth</h1>' +
      '<div class="kpi-row cols-4">' +
        kpiHTML("Avg Shared Reps", overlapAvg.toFixed(1)) +
        kpiHTML("Avg R % Top Reps", fmtPct(rTopAvg)) +
        kpiHTML("Avg I % Top Reps", fmtPct(iTopAvg)) +
        kpiHTML("Avg Bandwidth Gap", fmtPct(gapAvg)) +
      '</div>' +
      '<div class="chart-grid cols-2">' +
        '<div class="span-2">' + chartCardHTML("zs1", "% Top Reps Side-by-Side — Rosen vs IIBS") + '</div>' +
        chartCardHTML("zs2", "Bandwidth Scatter — R% Top vs I% Top") +
        chartCardHTML("zs3", "Retry Allocation — Stacked to 100%") +
        chartCardHTML("zs4", "Rep Overlap Count Over Time") +
        chartCardHTML("zs5", "Revenue Impact — Net Rev (S-C) + % Top Overlay") +
        chartCardHTML("zs6", "Hours vs Combined Net Revenue — Scatter") +
      '</div>' +
      tableHTML("Bandwidth Allocation — All Months",
        ["Month","Hours","Shifts","R % Top","I % Top","Gap","R Net Rev","I Net Rev","Overlap","Shared Rep Names"],
        tblRows,
        { repNamesCol: 9 }
      );
  }
  function chartsDB3() {
    // 1. Grouped bar: R% top vs I% top
    mkChart("zs1", {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          { label: "Rosen % Top", data: col("r_pct_top"), backgroundColor: C.indigo + "CC", borderColor: C.indigo, borderWidth: 1 },
          { label: "IIBS % Top", data: col("i_pct_top"), backgroundColor: C.cyan + "CC", borderColor: C.cyan, borderWidth: 1 },
        ],
      },
      options: { aspectRatio: 2.8, scales: { x: makeScaleX(), y: makeScaleY("% Top Reps", "%") } },
    });

    // 2. Scatter: R% top vs I% top
    mkChart("zs2", {
      type: "scatter",
      data: {
        datasets: [{
          label: "R% vs I%",
          data: D.map(function(d) { return { x: d.r_pct_top, y: d.i_pct_top }; }),
          backgroundColor: C.indigo + "AA",
          borderColor: C.indigo,
          borderWidth: 1,
          pointRadius: 6,
          pointHoverRadius: 8,
        }],
      },
      options: {
        aspectRatio: 1.6,
        scales: {
          x: { ...makeScaleX(), title: { display: true, text: "Rosen % Top", font: { size: 10 }, color: C.textMuted }, ticks: { callback: function(v) { return v + "%"; } } },
          y: { ...makeScaleY("IIBS % Top", "%"), ticks: { callback: function(v) { return v + "%"; } } },
        },
      },
    });

    // 3. Retry allocation stacked area
    mkChart("zs3", {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          { label: "Rosen Retry Share", data: col("r_retry_share"), borderColor: C.indigo, backgroundColor: C.indigo + "55", fill: true, borderWidth: 2 },
          { label: "IIBS Retry Share", data: col("i_retry_share"), borderColor: C.cyan, backgroundColor: C.cyan + "55", fill: true, borderWidth: 2 },
        ],
      },
      options: {
        aspectRatio: 1.6,
        scales: { x: makeScaleX(), y: { ...makeScaleY(null, "%"), stacked: true, max: 100 } },
        plugins: { filler: { propagate: true } },
      },
    });

    // 4. Overlap count line + area
    mkChart("zs4", {
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          label: "Overlap Count",
          data: col("overlap_count"),
          borderColor: C.amber,
          backgroundColor: function(ctx) { return makeGradient(ctx.chart.ctx, C.amber, 0.25, 0); },
          fill: true,
          borderWidth: 2,
        }],
      },
      options: { aspectRatio: 1.6, scales: { x: makeScaleX(), y: { ...makeScaleY("Count", ""), ticks: { stepSize: 1 } } } },
    });

    // 5. Revenue Impact — dual lines + % top conceptual overlay
    mkChart("zs5", {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          { label: "R Net Rev (S-C)", data: col("r_net_sc"), borderColor: C.indigo, borderWidth: 2, yAxisID: "y" },
          { label: "I Net Rev (S-C)", data: col("i_net_sc"), borderColor: C.cyan, borderWidth: 2, yAxisID: "y" },
          { label: "R % Top", data: col("r_pct_top"), borderColor: C.amber, borderDash: [5, 3], borderWidth: 1.5, yAxisID: "y1", pointRadius: 0 },
          { label: "I % Top", data: col("i_pct_top"), borderColor: C.emerald, borderDash: [5, 3], borderWidth: 1.5, yAxisID: "y1", pointRadius: 0 },
        ],
      },
      options: {
        aspectRatio: 1.6,
        scales: {
          x: makeScaleX(),
          y: makeScaleY("Net Rev (S-C)", "$"),
          y1: makeScaleYRight("% Top Reps", "%"),
        },
      },
    });

    // 6. Hours vs Combined Net Revenue scatter
    mkChart("zs6", {
      type: "scatter",
      data: {
        datasets: [{
          label: "Hours vs Combined Net Rev",
          data: D.map(function(d) { return { x: d.hours, y: d.c_net_sc }; }),
          backgroundColor: C.emerald + "AA",
          borderColor: C.emerald,
          borderWidth: 1,
          pointRadius: 6,
          pointHoverRadius: 8,
        }],
      },
      options: {
        aspectRatio: 1.6,
        scales: {
          x: { ...makeScaleX(), title: { display: true, text: "Hours", font: { size: 10 }, color: C.textMuted }, ticks: { callback: function(v) { return fmtNum(v); } } },
          y: makeScaleY("Combined Net Rev (S-C)", "$"),
        },
      },
    });
  }

  // ══════════════════════════════════════════════
  //  DB4: Fair Context — Rosen Inputs vs Outputs
  // ══════════════════════════════════════════════
  function renderDB4() {
    var hrsAvg = avg(col("hours"));
    var shfAvg = avg(col("shifts"));
    var leadsAvg = avg(col("r_leads"));
    var pctAvg = avg(col("r_pct_top"));
    var netAvg = avg(col("r_net_sc"));

    var tblRows = D.map(function(d) {
      return [
        d.short,
        fmtNum(d.hours),
        fmtNum(d.shifts),
        fmtNum(d.r_leads),
        fmtNum(d.r_retries),
        fmtPct(d.r_pct_top),
        "→",
        fmtDollar(d.r_net_churn),
        fmtDollar(d.r_net_sc),
        fmtDollar(d.r_sales),
        fmtX(d.r_mroi),
        fmtX(d.r_roas),
        "$" + d.r_rph.toFixed(1)
      ];
    });

    return '<h1 class="db-title">Fair Context — Rosen Inputs vs Outputs</h1>' +
      '<div class="kpi-row cols-5">' +
        kpiHTML("Avg Hours", fmtNum(hrsAvg)) +
        kpiHTML("Avg Shifts", fmtNum(shfAvg)) +
        kpiHTML("Avg Leads", fmtNum(leadsAvg)) +
        kpiHTML("Avg % Top Reps", fmtPct(pctAvg)) +
        kpiHTML("Avg Net Rev (S-C)", fmtK(netAvg)) +
      '</div>' +
      '<div class="chart-grid cols-2">' +
        '<div class="span-2">' + chartCardHTML("fc1", "Hours → Net Rev Post Churn — Dual Axis") + '</div>' +
        chartCardHTML("fc2", "Scatter — Hours vs Net Rev (S-C)") +
        chartCardHTML("fc3", "Scatter — % Top Reps vs Net Rev (S-C)") +
        chartCardHTML("fc4", "Shifts → mROI — Dual Axis") +
        chartCardHTML("fc5", "Leads & Retries Trend") +
        chartCardHTML("fc6", "Leads vs Acquisitions — Dual Axis") +
      '</div>' +
      tableHTML("Input-Output Summary — All Months",
        ["Month","Hours","Shifts","Leads","Retries","% Top Reps","→","Net Rev Post Churn","Net Rev (S-C)","Sales Rev","mROI","ROAS","Rev/Hr"],
        tblRows
      );
  }
  function chartsDB4() {
    // 1. Hours (area, left) + Net Rev Post Churn (line, right)
    mkChart("fc1", {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          { label: "Hours", data: col("hours"), borderColor: C.cyan, backgroundColor: function(ctx) { return makeGradient(ctx.chart.ctx, C.cyan, 0.25, 0); }, fill: true, borderWidth: 2, yAxisID: "y" },
          { label: "Net Rev Post Churn", data: col("r_net_churn"), borderColor: C.indigo, borderWidth: 2.5, yAxisID: "y1", fill: false },
        ],
      },
      options: {
        aspectRatio: 2.8,
        scales: {
          x: makeScaleX(),
          y: makeScaleY("Hours", "", function(v) { return fmtNum(v); }),
          y1: makeScaleYRight("Net Rev Post Churn", "$"),
        },
      },
    });

    // 2. Hours vs Net Rev scatter
    mkChart("fc2", {
      type: "scatter",
      data: {
        datasets: [{
          label: "Hours vs Net Rev",
          data: D.map(function(d) { return { x: d.hours, y: d.r_net_sc }; }),
          backgroundColor: C.indigo + "AA",
          borderColor: C.indigo,
          borderWidth: 1,
          pointRadius: 6,
          pointHoverRadius: 8,
        }],
      },
      options: {
        aspectRatio: 1.6,
        scales: {
          x: { ...makeScaleX(), title: { display: true, text: "Hours", font: { size: 10 }, color: C.textMuted }, ticks: { callback: function(v) { return fmtNum(v); } } },
          y: makeScaleY("Net Rev (S-C)", "$"),
        },
      },
    });

    // 3. % Top Reps vs Net Rev scatter
    mkChart("fc3", {
      type: "scatter",
      data: {
        datasets: [{
          label: "% Top vs Net Rev",
          data: D.map(function(d) { return { x: d.r_pct_top, y: d.r_net_sc }; }),
          backgroundColor: C.emerald + "AA",
          borderColor: C.emerald,
          borderWidth: 1,
          pointRadius: 6,
          pointHoverRadius: 8,
        }],
      },
      options: {
        aspectRatio: 1.6,
        scales: {
          x: { ...makeScaleX(), title: { display: true, text: "% Top Reps", font: { size: 10 }, color: C.textMuted }, ticks: { callback: function(v) { return v + "%"; } } },
          y: makeScaleY("Net Rev (S-C)", "$"),
        },
      },
    });

    // 4. Shifts → mROI dual axis
    mkChart("fc4", {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          { label: "Shifts", data: col("shifts"), backgroundColor: C.amber + "88", borderColor: C.amber, borderWidth: 1, yAxisID: "y", order: 2 },
          { type: "line", label: "mROI", data: col("r_mroi"), borderColor: C.indigo, borderWidth: 2.5, yAxisID: "y1", order: 1, pointRadius: 0 },
        ],
      },
      options: {
        aspectRatio: 1.6,
        scales: {
          x: makeScaleX(),
          y: makeScaleY("Shifts", "", function(v) { return fmtNum(v); }),
          y1: makeScaleYRight("mROI", "x"),
        },
      },
    });

    // 5. Leads & Retries Trend
    mkChart("fc5", {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          { label: "Leads", data: col("r_leads"), borderColor: C.amber, borderWidth: 2 },
          { label: "Retries", data: col("r_retries"), borderColor: C.red, borderWidth: 2 },
        ],
      },
      options: {
        aspectRatio: 1.6,
        scales: {
          x: makeScaleX(),
          y: makeScaleY(null, "", function(v) { return fmtNum(v); }),
        },
      },
    });

    // 6. Leads vs Acquisitions dual axis
    mkChart("fc6", {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          { label: "Leads", data: col("r_leads"), backgroundColor: C.cyan + "88", borderColor: C.cyan, borderWidth: 1, yAxisID: "y", order: 2 },
          { type: "line", label: "Acquisitions", data: col("r_acq"), borderColor: C.emerald, borderWidth: 2.5, yAxisID: "y1", order: 1, pointRadius: 0 },
        ],
      },
      options: {
        aspectRatio: 1.6,
        scales: {
          x: makeScaleX(),
          y: makeScaleY("Leads", "", function(v) { return fmtNum(v); }),
          y1: makeScaleYRight("Acquisitions", "", function(v) { return fmtNum(v); }),
        },
      },
    });
  }

  // ══════════════════════════════════════════════
  //  DB5: CEO Strategic Overview
  // ══════════════════════════════════════════════
  function renderDB5() {
    var rNetChAvg = avg(col("r_net_churn")), iNetChAvg = avg(col("i_net_churn"));
    var rNetAvg = avg(col("r_net_sc")), iNetAvg = avg(col("i_net_sc"));
    var rMroiAvg = avg(col("r_mroi")), iMroiAvg = avg(col("i_mroi"));
    var rRoasAvg = avg(col("r_roas")), iRoasAvg = avg(col("i_roas"));
    var rRphAvg = avg(col("r_rph")), iRphAvg = avg(col("i_rph"));
    var rSalesAvg = avg(col("r_sales")), iSalesAvg = avg(col("i_sales"));

    return '<h1 class="db-title">CEO Strategic Overview</h1>' +
      '<div class="kpi-row cols-6">' +
        kpiCompareHTML("Net Rev Post Churn", fmtK(rNetChAvg), fmtK(iNetChAvg)) +
        kpiCompareHTML("Net Rev (S-C)", fmtK(rNetAvg), fmtK(iNetAvg)) +
        kpiCompareHTML("mROI", fmtX(rMroiAvg), fmtX(iMroiAvg)) +
        kpiCompareHTML("ROAS", fmtX(rRoasAvg), fmtX(iRoasAvg)) +
        kpiCompareHTML("Rev/Hr", "$" + rRphAvg.toFixed(0), "$" + iRphAvg.toFixed(0)) +
        kpiCompareHTML("Sales Rev", fmtK(rSalesAvg), fmtK(iSalesAvg)) +
      '</div>' +
      '<div class="chart-grid cols-2">' +
        chartCardHTML("ceo1", "Net Rev (S-C) — R vs I") +
        chartCardHTML("ceo2", "Net Rev Post Churn — R vs I") +
        chartCardHTML("ceo3", "mROI — R vs I") +
        chartCardHTML("ceo4", "ROAS — R vs I") +
        chartCardHTML("ceo5", "Sales Rev — R vs I") +
        chartCardHTML("ceo6", "Media Cost — R vs I") +
      '</div>';
  }
  function chartsDB5() {
    var dualLine = function(id, rField, iField, yLabel, yPre) {
      mkChart(id, {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            { label: "Rosen", data: col(rField), borderColor: C.indigo, borderWidth: 2 },
            { label: "IIBS", data: col(iField), borderColor: C.cyan, borderWidth: 2 },
          ],
        },
        options: { aspectRatio: 1.6, scales: { x: makeScaleX(), y: makeScaleY(yLabel, yPre) } },
      });
    };
    dualLine("ceo1", "r_net_sc", "i_net_sc", "Net Rev (S-C)", "$");
    dualLine("ceo2", "r_net_churn", "i_net_churn", "Net Rev Post Churn", "$");
    dualLine("ceo3", "r_mroi", "i_mroi", "mROI", "x");
    dualLine("ceo4", "r_roas", "i_roas", "ROAS", "x");
    dualLine("ceo5", "r_sales", "i_sales", "Sales Rev", "$");
    dualLine("ceo6", "r_cost", "i_cost", "Media Cost", "$");
  }

  // ══════════════════════════════════════════════
  //  DB6: Top Reps Correlation (Rosen/IIBS sub-tabs)
  // ══════════════════════════════════════════════
  var db6SubTab = "rosen";

  function renderDB6() {
    return '<h1 class="db-title">Top Reps — Revenue Correlation</h1>' +
      '<div class="sub-tabs" id="db6Tabs">' +
        '<button class="sub-tab ' + (db6SubTab === "rosen" ? "active" : "") + '" data-sub="rosen">Rosen</button>' +
        '<button class="sub-tab ' + (db6SubTab === "iibs" ? "active" : "") + '" data-sub="iibs">IIBS</button>' +
      '</div>' +
      '<div id="db6Content"></div>';
  }

  function renderDB6Content() {
    var isR = db6SubTab === "rosen";
    var pctField = isR ? "r_pct_top" : "i_pct_top";
    var netField = isR ? "r_net_sc" : "i_net_sc";
    var netChurnField = isR ? "r_net_churn" : "i_net_churn";
    var salesField = isR ? "r_sales" : "i_sales";
    var mroiField = isR ? "r_mroi" : "i_mroi";
    var topNamesField = isR ? "r_top_names" : "i_top_names";
    var threshold = isR ? 65 : 50;
    var pctData = col(pctField);
    var netData = col(netField);

    var avgPct = avg(pctData);
    var above = D.filter(function(d) { return d[pctField] >= threshold; });
    var below = D.filter(function(d) { return d[pctField] < threshold; });
    var aboveAvg = above.length ? avg(above.map(function(d) { return d[netField]; })) : 0;
    var belowAvg = below.length ? avg(below.map(function(d) { return d[netField]; })) : 0;
    var delta = aboveAvg - belowAvg;

    // Rep names table
    var repTableRows = D.map(function(d) {
      return [
        d.short,
        fmtPct(d[pctField]),
        (d[topNamesField] || []).join(", ") || "—",
        fmtDollar(d[netChurnField]),
        fmtDollar(d[netField]),
        fmtDollar(d[salesField]),
        fmtX(d[mroiField]),
        fmtNum(d.hours)
      ];
    });

    // Top 10 months by net rev
    var sorted = D.slice().sort(function(a, b) { return b[netField] - a[netField]; }).slice(0, 10);

    var container = document.getElementById("db6Content");
    container.innerHTML =
      '<div class="kpi-row cols-5">' +
        kpiHTML("Avg % Top Reps", fmtPct(avgPct)) +
        kpiHTML("Months Above " + threshold + "%", String(above.length)) +
        kpiHTML("Avg Rev When High", fmtK(aboveAvg)) +
        kpiHTML("Avg Rev When Low", fmtK(belowAvg)) +
        kpiHTML("Delta", fmtK(delta)) +
      '</div>' +
      '<div class="chart-grid cols-2">' +
        '<div class="span-2">' + chartCardHTML("tr1", "% Top Reps (Area) + Net Rev S-C (Line) — Dual Axis") + '</div>' +
        chartCardHTML("tr2", "Correlation Scatter — % Top Reps vs Net Rev (S-C)") +
        chartCardHTML("tr3", "% Top Reps (Area) + Sales Rev (Line) — Dual Axis") +
        chartCardHTML("tr4", "Top 10 Months by Net Rev — Horizontal Bars") +
        chartCardHTML("tr5", "Hours + % Top Reps — Dual Axis") +
      '</div>' +
      tableHTML("Rep Names & Performance — All Months",
        ["Month","% Top Reps","Top Rep Names","Net Rev Post Churn","Net Rev (S-C)","Sales Rev","mROI","Hours"],
        repTableRows,
        { cyanCol: 1, repNamesCol: 2 }
      );

    var accentColor = isR ? C.indigo : C.cyan;

    // 1. % Top Reps area + Net Rev line
    mkChart("tr1", {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          { label: "% Top Reps", data: pctData, borderColor: C.cyan, backgroundColor: function(ctx) { return makeGradient(ctx.chart.ctx, C.cyan, 0.25, 0); }, fill: true, borderWidth: 2, yAxisID: "y" },
          { label: "Net Rev (S-C)", data: netData, borderColor: C.emerald, borderWidth: 2.5, yAxisID: "y1", fill: false },
        ],
      },
      options: {
        aspectRatio: 2.8,
        scales: { x: makeScaleX(), y: makeScaleY("% Top Reps", "%"), y1: makeScaleYRight("Net Rev (S-C)", "$") },
      },
    });

    // 2. Scatter — % Top vs Net Rev
    mkChart("tr2", {
      type: "scatter",
      data: {
        datasets: [{
          label: "% Top vs Net Rev",
          data: D.map(function(d) { return { x: d[pctField], y: d[netField] }; }),
          backgroundColor: accentColor + "AA",
          borderColor: accentColor,
          borderWidth: 1,
          pointRadius: 6,
          pointHoverRadius: 8,
        }],
      },
      options: {
        aspectRatio: 1.6,
        scales: {
          x: { ...makeScaleX(), title: { display: true, text: "% Top Reps", font: { size: 10 }, color: C.textMuted }, ticks: { callback: function(v) { return v + "%"; } } },
          y: makeScaleY("Net Rev (S-C)", "$"),
        },
      },
    });

    // 3. % Top Reps area + Sales Rev line
    mkChart("tr3", {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          { label: "% Top Reps", data: pctData, borderColor: C.cyan, backgroundColor: function(ctx) { return makeGradient(ctx.chart.ctx, C.cyan, 0.2, 0); }, fill: true, borderWidth: 2, yAxisID: "y" },
          { label: "Sales Rev", data: col(salesField), borderColor: C.amber, borderWidth: 2.5, yAxisID: "y1", fill: false },
        ],
      },
      options: {
        aspectRatio: 1.6,
        scales: { x: makeScaleX(), y: makeScaleY("% Top Reps", "%"), y1: makeScaleYRight("Sales Rev", "$") },
      },
    });

    // 4. Top 10 horizontal bars
    mkChart("tr4", {
      type: "bar",
      data: {
        labels: sorted.map(function(d) { return d.short + " (" + d[pctField].toFixed(0) + "%)"; }),
        datasets: [{
          label: "Net Rev (S-C)",
          data: sorted.map(function(d) { return d[netField]; }),
          backgroundColor: sorted.map(function(d) { return d[pctField] >= threshold ? C.emerald + "CC" : C.amber + "CC"; }),
          borderColor: sorted.map(function(d) { return d[pctField] >= threshold ? C.emerald : C.amber; }),
          borderWidth: 1,
        }],
      },
      options: {
        indexAxis: "y",
        aspectRatio: 1.4,
        scales: {
          x: makeScaleY("Net Rev (S-C)", "$"),
          y: { ticks: { font: { size: 10 } }, grid: { display: false } },
        },
        plugins: { legend: { display: false } },
      },
    });

    // 5. Hours + % Top Reps dual axis
    mkChart("tr5", {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          { label: "Hours", data: col("hours"), backgroundColor: C.indigo + "77", borderColor: C.indigo, borderWidth: 1, yAxisID: "y", order: 2 },
          { type: "line", label: "% Top Reps", data: pctData, borderColor: C.cyan, borderWidth: 2.5, yAxisID: "y1", order: 1, pointRadius: 0 },
        ],
      },
      options: {
        aspectRatio: 1.6,
        scales: {
          x: makeScaleX(),
          y: makeScaleY("Hours", "", function(v) { return fmtNum(v); }),
          y1: makeScaleYRight("% Top Reps", "%"),
        },
      },
    });
  }

  // ══════════════════════════════════════════════
  //  DB7: Monthly Intelligence Briefing
  // ══════════════════════════════════════════════
  var db7SubTab = "rosen";

  function renderDB7() {
    return '<h1 class="db-title">Monthly Intelligence Briefing</h1>' +
      '<div class="sub-tabs" id="db7Tabs">' +
        '<button class="sub-tab ' + (db7SubTab === "rosen" ? "active" : "") + '" data-sub="rosen">Rosen</button>' +
        '<button class="sub-tab ' + (db7SubTab === "iibs" ? "active" : "") + '" data-sub="iibs">IIBS</button>' +
        '<button class="sub-tab ' + (db7SubTab === "combined" ? "active" : "") + '" data-sub="combined">Combined</button>' +
      '</div>' +
      '<div id="db7Content"></div>';
  }

  function renderDB7Content() {
    var pre, netChurnField, netSCField, mroiField, roasField, rphField, salesField, costField, cpaField, acqField, convField, labelName;

    if (db7SubTab === "rosen") {
      pre = "r_"; labelName = "Rosen";
      netChurnField = "r_net_churn"; netSCField = "r_net_sc"; mroiField = "r_mroi"; roasField = "r_roas";
      rphField = "r_rph"; salesField = "r_sales"; costField = "r_cost"; cpaField = "r_cpa"; acqField = "r_acq"; convField = "r_conv";
    } else if (db7SubTab === "iibs") {
      pre = "i_"; labelName = "IIBS";
      netChurnField = "i_net_churn"; netSCField = "i_net_sc"; mroiField = "i_mroi"; roasField = "i_roas";
      rphField = "i_rph"; salesField = "i_sales"; costField = "i_cost"; cpaField = "i_cpa"; acqField = "i_acq"; convField = "i_conv";
    } else {
      pre = null; labelName = "Combined";
      netChurnField = null; netSCField = "c_net_sc"; mroiField = "r_mroi"; roasField = "r_roas";
      rphField = null; salesField = "c_sales"; costField = "c_cost"; cpaField = null; acqField = null; convField = null;
    }

    var isCombined = db7SubTab === "combined";
    var netField = isCombined ? "c_net_sc" : (pre + "net_churn");
    var netData = col(netField);
    var avgVal = avg(netData);
    var maxIdx = netData.indexOf(Math.max.apply(null, netData));
    var minIdx = netData.indexOf(Math.min.apply(null, netData));
    var last3 = avg(netData.slice(-3));
    var prior3 = avg(netData.slice(-6, -3));
    var trendPct = ((last3 - prior3) / prior3 * 100);

    // Full metrics table
    var tblRows;
    if (!isCombined) {
      tblRows = D.map(function(d) {
        return [
          d.short,
          fmtDollar(d[pre + "net_churn"]),
          fmtDollar(d[pre + "net_sc"]),
          fmtX(d[pre + "mroi"]),
          fmtX(d[pre + "roas"]),
          "$" + d[pre + "rph"].toFixed(1),
          fmtNum(d.hours),
          fmtNum(d.shifts),
          fmtDollar(d[pre + "sales"]),
          fmtDollar(d[pre + "cost"]),
          "$" + Math.round(d[pre + "cpa"]),
          fmtNum(d[pre + "acq"]),
          d[pre + "conv"].toFixed(1) + "%"
        ];
      });
    } else {
      tblRows = D.map(function(d) {
        return [
          d.short,
          fmtDollar(d.c_net_sc),
          fmtDollar(d.r_net_sc),
          fmtDollar(d.i_net_sc),
          fmtX(d.r_mroi),
          fmtX(d.i_mroi),
          fmtNum(d.hours),
          fmtNum(d.shifts),
          fmtDollar(d.c_sales),
          fmtDollar(d.c_cost)
        ];
      });
    }

    var tblHeaders = !isCombined
      ? ["Month","Net Rev Post Churn","Net Rev (S-C)","mROI","ROAS","Rev/Hr","Hours","Shifts","Sales Rev","Cost","CPA","Acq","Conv%"]
      : ["Month","Combined Net Rev","R Net Rev","I Net Rev","R mROI","I mROI","Hours","Shifts","Combined Sales","Combined Cost"];

    var container = document.getElementById("db7Content");
    container.innerHTML =
      '<div class="kpi-row cols-4">' +
        kpiHTML("Best Month", D[maxIdx].short + " — " + fmtK(netData[maxIdx])) +
        kpiHTML("Worst Month", D[minIdx].short + " — " + fmtK(netData[minIdx])) +
        kpiHTML("26-Month Avg", fmtK(avgVal)) +
        kpiHTML("Trend (L3 vs P3)", (trendPct >= 0 ? "+" : "") + trendPct.toFixed(1) + "%") +
      '</div>' +
      '<div class="chart-grid cols-2">' +
        (isCombined ? '' : '<div class="span-2">' + chartCardHTML("mi1", labelName + " — Net Rev Post Churn Trend") + '</div>') +
        (isCombined ? '<div class="span-2">' + chartCardHTML("mi2", "Combined Net Rev (S-C) Trend") + '</div>' :
          chartCardHTML("mi2", labelName + " — Net Rev (S-C) Trend")) +
        chartCardHTML("mi3", (isCombined ? "R vs I mROI" : "mROI + ROAS — Dual Line")) +
        chartCardHTML("mi4", (isCombined ? "Hours Trend" : "Rev/Hr + Hours — Dual Axis")) +
        '<div class="span-2">' + chartCardHTML("mi5", "All 26 Months — Sorted by " + (isCombined ? "Combined Net Rev" : "Net Rev"), 500) + '</div>' +
      '</div>' +
      tableHTML("Full Metrics — " + labelName, tblHeaders, tblRows);

    var accentColor = db7SubTab === "iibs" ? C.cyan : C.indigo;

    // 1. Net Rev Post Churn trend (not for combined)
    if (!isCombined) {
      mkChart("mi1", {
        type: "line",
        data: {
          labels: labels,
          datasets: [{
            label: "Net Rev Post Churn",
            data: col(pre + "net_churn"),
            borderColor: accentColor,
            backgroundColor: function(ctx) { return makeGradient(ctx.chart.ctx, accentColor, 0.2, 0); },
            fill: true,
            borderWidth: 2,
          }],
        },
        options: { aspectRatio: 2.8, scales: { x: makeScaleX(), y: makeScaleY(null, "$") }, plugins: { legend: { display: false } } },
      });
    }

    // 2. Net Rev (S-C) trend
    if (!isCombined) {
      mkChart("mi2", {
        type: "line",
        data: {
          labels: labels,
          datasets: [{
            label: "Net Rev (S-C)",
            data: col(netSCField),
            borderColor: C.emerald,
            backgroundColor: function(ctx) { return makeGradient(ctx.chart.ctx, C.emerald, 0.15, 0); },
            fill: true,
            borderWidth: 2,
          }],
        },
        options: { aspectRatio: 1.6, scales: { x: makeScaleX(), y: makeScaleY(null, "$") }, plugins: { legend: { display: false } } },
      });
    } else {
      mkChart("mi2", {
        type: "line",
        data: {
          labels: labels,
          datasets: [{
            label: "Combined Net Rev (S-C)",
            data: col("c_net_sc"),
            borderColor: accentColor,
            backgroundColor: function(ctx) { return makeGradient(ctx.chart.ctx, accentColor, 0.2, 0); },
            fill: true,
            borderWidth: 2,
          }],
        },
        options: { aspectRatio: 2.8, scales: { x: makeScaleX(), y: makeScaleY(null, "$") }, plugins: { legend: { display: false } } },
      });
    }

    // 3. mROI + ROAS (or combined comparison)
    if (!isCombined) {
      mkChart("mi3", {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            { label: "mROI", data: col(mroiField), borderColor: C.amber, borderWidth: 2 },
            { label: "ROAS", data: col(roasField), borderColor: C.emerald, borderWidth: 2 },
          ],
        },
        options: { aspectRatio: 1.6, scales: { x: makeScaleX(), y: makeScaleY(null, "x") } },
      });
    } else {
      mkChart("mi3", {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            { label: "R mROI", data: col("r_mroi"), borderColor: C.indigo, borderWidth: 2 },
            { label: "I mROI", data: col("i_mroi"), borderColor: C.cyan, borderWidth: 2 },
          ],
        },
        options: { aspectRatio: 1.6, scales: { x: makeScaleX(), y: makeScaleY("mROI", "x") } },
      });
    }

    // 4. Rev/Hr + Hours dual axis (or hours only for combined)
    if (!isCombined) {
      mkChart("mi4", {
        type: "bar",
        data: {
          labels: labels,
          datasets: [
            { label: "Hours", data: col("hours"), backgroundColor: accentColor + "77", borderColor: accentColor, borderWidth: 1, yAxisID: "y", order: 2 },
            { type: "line", label: "Rev/Hr", data: col(rphField), borderColor: C.amber, borderWidth: 2.5, yAxisID: "y1", order: 1, pointRadius: 0 },
          ],
        },
        options: {
          aspectRatio: 1.6,
          scales: {
            x: makeScaleX(),
            y: makeScaleY("Hours", "", function(v) { return fmtNum(v); }),
            y1: makeScaleYRight("Rev/Hr", "$"),
          },
        },
      });
    } else {
      mkChart("mi4", {
        type: "line",
        data: {
          labels: labels,
          datasets: [{
            label: "Hours",
            data: col("hours"),
            borderColor: C.amber,
            backgroundColor: function(ctx) { return makeGradient(ctx.chart.ctx, C.amber, 0.2, 0); },
            fill: true,
            borderWidth: 2,
          }],
        },
        options: { aspectRatio: 1.6, scales: { x: makeScaleX(), y: makeScaleY("Hours", "", function(v) { return fmtNum(v); }) } },
      });
    }

    // 5. Sorted horizontal bars — all 26 months
    var sortedData = D.slice().map(function(d, i) { return { label: d.short, val: netData[i] }; }).sort(function(a, b) { return b.val - a.val; });
    var maxVal = sortedData[0].val;
    var minVal = sortedData[sortedData.length - 1].val;
    var barColors = sortedData.map(function(d) {
      var ratio = (d.val - minVal) / (maxVal - minVal || 1);
      // Green=high, Red=low
      var r = Math.round(239 * (1 - ratio) + 16 * ratio);
      var g = Math.round(68 * (1 - ratio) + 185 * ratio);
      var b = Math.round(68 * (1 - ratio) + 129 * ratio);
      return "rgba(" + r + "," + g + "," + b + ",0.8)";
    });

    mkChart("mi5", {
      type: "bar",
      data: {
        labels: sortedData.map(function(d) { return d.label; }),
        datasets: [{
          label: "Net Rev",
          data: sortedData.map(function(d) { return d.val; }),
          backgroundColor: barColors,
          borderWidth: 0,
        }],
      },
      options: {
        indexAxis: "y",
        aspectRatio: 0.8,
        scales: {
          x: makeScaleY(null, "$"),
          y: { ticks: { font: { size: 10 } }, grid: { display: false } },
        },
        plugins: { legend: { display: false } },
      },
    });
  }

  // ══════════════════════════════════════════════
  //  Dashboard Registry
  // ══════════════════════════════════════════════
  var dbRenderers = [renderDB0, renderDB1, renderDB2, renderDB3, renderDB4, renderDB5, renderDB6, renderDB7];
  var dbCharters = [chartsDB0, chartsDB1, chartsDB2, chartsDB3, chartsDB4, chartsDB5, chartsDB6Inner, chartsDB7Inner];

  function chartsDB6Inner() { renderDB6Content(); }
  function chartsDB7Inner() { renderDB7Content(); }

  // ══════════════════════════════════════════════
  //  Navigation
  // ══════════════════════════════════════════════
  var activeDB = 0;

  function switchDB(idx) {
    if (idx === activeDB && document.getElementById("dashboardContainer").children.length > 0) return;
    activeDB = idx;

    // Update nav
    document.querySelectorAll(".nav-item").forEach(function(btn, i) {
      btn.classList.toggle("active", i === idx);
    });

    destroyCharts();
    var container = $("#dashboardContainer");
    container.innerHTML = '<div class="dashboard-view">' + dbRenderers[idx]() + '</div>';
    dbCharters[idx]();

    // Wire sub-tabs for DB6
    if (idx === 6) {
      document.getElementById("db6Tabs").addEventListener("click", function(e) {
        var sub = e.target.dataset.sub;
        if (!sub || sub === db6SubTab) return;
        db6SubTab = sub;
        document.querySelectorAll("#db6Tabs .sub-tab").forEach(function(b) { b.classList.toggle("active", b.dataset.sub === sub); });
        destroyCharts();
        renderDB6Content();
      });
    }

    // Wire sub-tabs for DB7
    if (idx === 7) {
      document.getElementById("db7Tabs").addEventListener("click", function(e) {
        var sub = e.target.dataset.sub;
        if (!sub || sub === db7SubTab) return;
        db7SubTab = sub;
        document.querySelectorAll("#db7Tabs .sub-tab").forEach(function(b) { b.classList.toggle("active", b.dataset.sub === sub); });
        destroyCharts();
        renderDB7Content();
      });
    }

    // Close mobile sidebar
    closeMobileSidebar();
  }

  // ── Sidebar events ──
  document.getElementById("sidebarNav").addEventListener("click", function(e) {
    var btn = e.target.closest(".nav-item");
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
