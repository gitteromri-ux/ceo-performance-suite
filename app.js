// ===== GLOBAL CHART DEFAULTS =====
Chart.defaults.font.family = "'General Sans', -apple-system, sans-serif";
Chart.defaults.color = '#a1a1a6';
Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(28,28,30,0.96)';
Chart.defaults.plugins.tooltip.titleColor = '#f5f5f7';
Chart.defaults.plugins.tooltip.bodyColor = '#a1a1a6';
Chart.defaults.plugins.tooltip.borderColor = 'rgba(255,255,255,0.1)';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.cornerRadius = 10;
Chart.defaults.plugins.tooltip.padding = 12;
Chart.defaults.plugins.tooltip.displayColors = true;
Chart.defaults.plugins.tooltip.boxPadding = 4;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.pointStyleWidth = 8;
Chart.defaults.plugins.legend.labels.padding = 20;
Chart.defaults.elements.point.radius = 4;
Chart.defaults.elements.point.hoverRadius = 6;
Chart.defaults.animation.duration = 800;
Chart.defaults.animation.easing = 'easeOutQuart';

// ===== COLORS =====
const C = {
  blue: '#0a84ff', blueDim: 'rgba(10, 132, 255, 0.25)',
  green: '#30d158', greenDim: 'rgba(48, 209, 88, 0.25)',
  orange: '#ff9f0a', orangeDim: 'rgba(255, 159, 10, 0.25)',
  red: '#ff453a', redDim: 'rgba(255, 69, 58, 0.15)',
  purple: '#bf5af2', purpleDim: 'rgba(191, 90, 242, 0.25)',
  teal: '#64d2ff', tealDim: 'rgba(100, 210, 255, 0.25)',
  cyan: '#5ac8fa', yellow: '#ffd60a',
  white: '#f5f5f7', muted: '#6e6e73',
  gridLine: 'rgba(255,255,255,0.05)',
};

// ===== UTILITY FUNCTIONS =====
function fmt(n, decimals = 1) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return Number(n).toFixed(decimals);
}
function fmtPct(n) { return fmt(n, 1) + '%'; }
function fmtK(n) {
  if (!n && n !== 0) return '$0';
  if (Math.abs(n) >= 1000) return '$' + (n/1000).toFixed(1) + 'k';
  return '$' + n.toFixed(0);
}
function fmtCurrency(n) {
  if (!n && n !== 0) return '$0';
  return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
}
function avg(arr) { return arr.reduce((a,b) => a+b, 0) / arr.length; }
function sum(arr) { return arr.reduce((a,b) => a+b, 0); }

function createKPI(label, value, delta, isHighlight, colorClass) {
  const card = document.createElement('div');
  card.className = 'kpi-card' + (isHighlight ? ' highlight' : '');
  card.innerHTML = `
    <span class="kpi-label">${label}</span>
    <span class="kpi-value ${colorClass || ''}">${value}</span>
    ${delta ? `<span class="kpi-delta">${delta}</span>` : ''}
  `;
  return card;
}

function makeGradient(ctx, color, alpha1 = 0.35, alpha2 = 0.0) {
  const g = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
  const c = hexToRgb(color);
  g.addColorStop(0, `rgba(${c},${alpha1})`);
  g.addColorStop(1, `rgba(${c},${alpha2})`);
  return g;
}
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

// Destroy chart instances in a container before re-render
function destroyChartsIn(sectionId) {
  document.querySelectorAll('#' + sectionId + ' canvas').forEach(c => {
    const ch = Chart.getChart(c);
    if (ch) ch.destroy();
  });
}

// Common scale options
const scaleX = (label) => ({
  title: { display: !!label, text: label, color: C.muted, font: { size: 11, weight: 500 } },
  grid: { display: false },
  ticks: { maxRotation: 45, font: { size: 10 } }
});
const scaleY = (label, cb) => ({
  title: { display: !!label, text: label, color: C.muted, font: { size: 11, weight: 500 } },
  grid: { color: C.gridLine },
  ticks: cb ? { callback: cb, font: { size: 10 } } : { font: { size: 10 } },
  beginAtZero: false
});
const scaleDollar = v => fmtK(v);
const scalePct = v => v + '%';

const labels = D.map(d => d.short);

// ===== LAZY RENDER REGISTRY =====
const rendered = {};

function renderTab(tabId) {
  if (rendered[tabId]) return;
  rendered[tabId] = true;
  const fn = renderers[tabId];
  if (fn) fn();
}

// ===== TAB NAVIGATION =====
document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.dashboard').forEach(d => d.classList.remove('active'));
    tab.classList.add('active');
    const tabId = tab.dataset.tab;
    document.getElementById(tabId).classList.add('active');
    setTimeout(() => {
      renderTab(tabId);
      setTimeout(() => {
        document.querySelectorAll('#' + tabId + ' canvas').forEach(c => {
          const chart = Chart.getChart(c);
          if (chart) { chart.resize(); chart.update('none'); }
        });
      }, 50);
    }, 30);
  });
});

// ===== DB1: Rosen Bottom Line =====
function renderDB1() {
  const kpiRow = document.getElementById('db1-kpis');
  kpiRow.innerHTML = '';
  const netChurnAvg = avg(D.map(d => d.r_net_churn));
  const netScAvg = avg(D.map(d => d.r_net_sc));
  const mroiAvg = avg(D.map(d => d.r_mroi));
  const roasAvg = avg(D.map(d => d.r_roas));
  const rphAvg = avg(D.map(d => d.r_rph));

  kpiRow.appendChild(createKPI('Avg Net Rev Post Churn', fmtCurrency(netChurnAvg), 'Sales − Cost − Churn', true, 'green'));
  kpiRow.appendChild(createKPI('Avg Net Rev (S−C)', fmtCurrency(netScAvg), 'Sales minus Cost', false, 'accent'));
  kpiRow.appendChild(createKPI('Avg mROI', fmt(mroiAvg, 2) + 'x', 'Marketing return on investment', false, ''));
  kpiRow.appendChild(createKPI('Avg ROAS', fmt(roasAvg, 2) + 'x', 'Return on ad spend', false, ''));
  kpiRow.appendChild(createKPI('Avg Rev/Hr', fmtCurrency(rphAvg), 'Revenue per hour', false, ''));
  kpiRow.appendChild(createKPI('Months', '26', 'Jan \'24 – Feb \'26', false, ''));

  // Chart 1: Three revenue lines
  const ctx1 = document.getElementById('db1-lines').getContext('2d');
  new Chart(ctx1, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Sales Revenue',
          data: D.map(d => d.r_sales),
          borderColor: C.purple,
          backgroundColor: makeGradient(ctx1, C.purple, 0.15, 0),
          borderWidth: 2.5, pointRadius: 3, tension: 0.3, fill: true
        },
        {
          label: 'Net Rev (S−C)',
          data: D.map(d => d.r_net_sc),
          borderColor: C.blue,
          backgroundColor: makeGradient(ctx1, C.blue, 0.2, 0),
          borderWidth: 2.5, pointRadius: 3, tension: 0.3, fill: true
        },
        {
          label: 'Net Rev Post Churn',
          data: D.map(d => d.r_net_churn),
          borderColor: C.green,
          backgroundColor: makeGradient(ctx1, C.green, 0.25, 0),
          borderWidth: 3, pointRadius: 4, tension: 0.3, fill: true
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: scaleX(''),
        y: { ...scaleY('Revenue', scaleDollar), beginAtZero: false }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${fmtCurrency(ctx.parsed.y)}`
          }
        }
      }
    }
  });

  // Chart 2: mROI bars + Hours line (dual axis)
  const ctx2 = document.getElementById('db1-mroi').getContext('2d');
  new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'mROI',
          data: D.map(d => d.r_mroi),
          backgroundColor: C.blueDim,
          borderColor: C.blue,
          borderWidth: 1.5, borderRadius: 6, barPercentage: 0.6, yAxisID: 'y'
        },
        {
          label: 'Hours',
          data: D.map(d => d.hours),
          type: 'line',
          borderColor: C.orange,
          backgroundColor: 'transparent',
          borderWidth: 2.5, pointRadius: 3, tension: 0.3, yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: scaleX(''),
        y: { ...scaleY('mROI', v => v + 'x'), position: 'left', beginAtZero: true },
        y1: { ...scaleY('Hours', v => v.toLocaleString()), position: 'right', grid: { display: false } }
      }
    }
  });

  // Chart 3: CPA by month
  const ctx3 = document.getElementById('db1-cpa').getContext('2d');
  new Chart(ctx3, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'CPA ($)',
        data: D.map(d => d.r_cpa),
        backgroundColor: D.map(d => {
          if (d.r_cpa < 400) return C.greenDim;
          if (d.r_cpa < 600) return C.orangeDim;
          return C.redDim;
        }),
        borderColor: D.map(d => {
          if (d.r_cpa < 400) return C.green;
          if (d.r_cpa < 600) return C.orange;
          return C.red;
        }),
        borderWidth: 1.5, borderRadius: 4, barPercentage: 0.65
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: scaleX(''),
        y: scaleY('CPA ($)', scaleDollar)
      },
      plugins: { legend: { display: false } }
    }
  });

  // Insight
  document.getElementById('db1-insight').innerHTML = `
    <h4>Key Finding</h4>
    <p>Over 26 months, Rosen averages <span class="green-text">${fmtCurrency(netChurnAvg)}</span> in Net Revenue Post Churn
    and <span class="highlight-text">${fmtCurrency(netScAvg)}</span> in Net Revenue (S−C).
    The gap between Sales Revenue and the bottom-line figures highlights the impact of media cost and churn.
    mROI averages <span class="highlight-text">${fmt(mroiAvg, 2)}x</span>, with a clear correlation to hours allocated —
    months with higher rep hours tend to deliver stronger ROI. CPA varies significantly, with the most efficient months
    coming in below $400 per acquisition.</p>
  `;
}

// ===== DB2: IIBS Bottom Line =====
function renderDB2() {
  const kpiRow = document.getElementById('db2-kpis');
  kpiRow.innerHTML = '';
  const netChurnAvg = avg(D.map(d => d.i_net_churn));
  const netScAvg = avg(D.map(d => d.i_net_sc));
  const mroiAvg = avg(D.map(d => d.i_mroi));
  const roasAvg = avg(D.map(d => d.i_roas));
  const rphAvg = avg(D.map(d => d.i_rph));

  kpiRow.appendChild(createKPI('Avg Net Rev Post Churn', fmtCurrency(netChurnAvg), 'Sales − Cost − Churn', true, 'green'));
  kpiRow.appendChild(createKPI('Avg Net Rev (S−C)', fmtCurrency(netScAvg), 'Sales minus Cost', false, 'accent'));
  kpiRow.appendChild(createKPI('Avg mROI', fmt(mroiAvg, 2) + 'x', 'Marketing return on investment', false, ''));
  kpiRow.appendChild(createKPI('Avg ROAS', fmt(roasAvg, 2) + 'x', 'Return on ad spend', false, ''));
  kpiRow.appendChild(createKPI('Avg Rev/Hr', fmtCurrency(rphAvg), 'Revenue per hour', false, ''));
  kpiRow.appendChild(createKPI('Months', '26', 'Jan \'24 – Feb \'26', false, ''));

  const ctx1 = document.getElementById('db2-lines').getContext('2d');
  new Chart(ctx1, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Sales Revenue',
          data: D.map(d => d.i_sales),
          borderColor: C.purple,
          backgroundColor: makeGradient(ctx1, C.purple, 0.15, 0),
          borderWidth: 2.5, pointRadius: 3, tension: 0.3, fill: true
        },
        {
          label: 'Net Rev (S−C)',
          data: D.map(d => d.i_net_sc),
          borderColor: C.blue,
          backgroundColor: makeGradient(ctx1, C.blue, 0.2, 0),
          borderWidth: 2.5, pointRadius: 3, tension: 0.3, fill: true
        },
        {
          label: 'Net Rev Post Churn',
          data: D.map(d => d.i_net_churn),
          borderColor: C.green,
          backgroundColor: makeGradient(ctx1, C.green, 0.25, 0),
          borderWidth: 3, pointRadius: 4, tension: 0.3, fill: true
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: scaleX(''),
        y: { ...scaleY('Revenue', scaleDollar), beginAtZero: false }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${fmtCurrency(ctx.parsed.y)}`
          }
        }
      }
    }
  });

  const ctx2 = document.getElementById('db2-mroi').getContext('2d');
  new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'mROI',
          data: D.map(d => d.i_mroi),
          backgroundColor: C.blueDim,
          borderColor: C.blue,
          borderWidth: 1.5, borderRadius: 6, barPercentage: 0.6, yAxisID: 'y'
        },
        {
          label: 'Hours',
          data: D.map(d => d.hours),
          type: 'line',
          borderColor: C.orange,
          backgroundColor: 'transparent',
          borderWidth: 2.5, pointRadius: 3, tension: 0.3, yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: scaleX(''),
        y: { ...scaleY('mROI', v => v + 'x'), position: 'left', beginAtZero: true },
        y1: { ...scaleY('Hours', v => v.toLocaleString()), position: 'right', grid: { display: false } }
      }
    }
  });

  const ctx3 = document.getElementById('db2-cpa').getContext('2d');
  new Chart(ctx3, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'CPA ($)',
        data: D.map(d => d.i_cpa),
        backgroundColor: D.map(d => {
          if (d.i_cpa < 500) return C.greenDim;
          if (d.i_cpa < 700) return C.orangeDim;
          return C.redDim;
        }),
        borderColor: D.map(d => {
          if (d.i_cpa < 500) return C.green;
          if (d.i_cpa < 700) return C.orange;
          return C.red;
        }),
        borderWidth: 1.5, borderRadius: 4, barPercentage: 0.65
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: scaleX(''),
        y: scaleY('CPA ($)', scaleDollar)
      },
      plugins: { legend: { display: false } }
    }
  });

  document.getElementById('db2-insight').innerHTML = `
    <h4>Key Finding</h4>
    <p>Over 26 months, IIBS averages <span class="green-text">${fmtCurrency(netChurnAvg)}</span> in Net Revenue Post Churn
    and <span class="highlight-text">${fmtCurrency(netScAvg)}</span> in Net Revenue (S−C).
    mROI averages <span class="highlight-text">${fmt(mroiAvg, 2)}x</span> with ROAS at ${fmt(roasAvg, 2)}x.
    IIBS generates higher total sales volume but also incurs higher media cost. Revenue per hour at
    <span class="highlight-text">${fmtCurrency(rphAvg)}</span> reflects IIBS's strong utilization of shared rep hours.</p>
  `;
}

// ===== DB3: Combined Total Business =====
function renderDB3() {
  const kpiRow = document.getElementById('db3-kpis');
  kpiRow.innerHTML = '';
  const totalNetSc = sum(D.map(d => d.c_net_sc));
  const totalSales = sum(D.map(d => d.c_sales));
  const totalCost = sum(D.map(d => d.c_cost));
  const avgHours = avg(D.map(d => d.hours));
  const avgShifts = avg(D.map(d => d.shifts));

  kpiRow.appendChild(createKPI('Total Combined Net Rev', fmtCurrency(totalNetSc), '26-month total (S−C)', true, 'green'));
  kpiRow.appendChild(createKPI('Combined Sales Rev', fmtCurrency(totalSales), '26-month total', false, 'accent'));
  kpiRow.appendChild(createKPI('Combined Cost', fmtCurrency(totalCost), '26-month total', false, 'orange'));
  kpiRow.appendChild(createKPI('Avg Hours/Month', fmt(avgHours, 0), 'Shared rep hours', false, ''));
  kpiRow.appendChild(createKPI('Avg Shifts/Month', fmt(avgShifts, 0), 'Shared rep shifts', false, ''));

  // Stacked bar
  const ctx1 = document.getElementById('db3-stacked').getContext('2d');
  new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Rosen Net Rev (S−C)',
          data: D.map(d => d.r_net_sc),
          backgroundColor: C.blueDim,
          borderColor: C.blue,
          borderWidth: 1.5, borderRadius: 4, barPercentage: 0.7
        },
        {
          label: 'IIBS Net Rev (S−C)',
          data: D.map(d => d.i_net_sc),
          backgroundColor: C.purpleDim,
          borderColor: C.purple,
          borderWidth: 1.5, borderRadius: 4, barPercentage: 0.7
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { ...scaleX(''), stacked: true },
        y: { ...scaleY('Net Revenue (S−C)', scaleDollar), stacked: true }
      },
      plugins: {
        tooltip: {
          callbacks: {
            afterBody: (items) => {
              const idx = items[0].dataIndex;
              return `Combined: ${fmtCurrency(D[idx].c_net_sc)}`;
            },
            label: ctx => `${ctx.dataset.label}: ${fmtCurrency(ctx.parsed.y)}`
          }
        }
      }
    }
  });

  // mROI overlay
  const ctx2 = document.getElementById('db3-mroi').getContext('2d');
  new Chart(ctx2, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Rosen mROI',
          data: D.map(d => d.r_mroi),
          borderColor: C.blue, backgroundColor: makeGradient(ctx2, C.blue, 0.15, 0),
          borderWidth: 2.5, pointRadius: 3, tension: 0.3, fill: true
        },
        {
          label: 'IIBS mROI',
          data: D.map(d => d.i_mroi),
          borderColor: C.purple, backgroundColor: makeGradient(ctx2, C.purple, 0.15, 0),
          borderWidth: 2.5, pointRadius: 3, tension: 0.3, fill: true
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: scaleX(''),
        y: scaleY('mROI', v => v + 'x')
      }
    }
  });

  // Hours + Shifts
  const ctx3 = document.getElementById('db3-hours').getContext('2d');
  new Chart(ctx3, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Hours',
          data: D.map(d => d.hours),
          borderColor: C.teal, backgroundColor: makeGradient(ctx3, C.teal, 0.2, 0),
          borderWidth: 2.5, pointRadius: 3, tension: 0.3, fill: true, yAxisID: 'y'
        },
        {
          label: 'Shifts',
          data: D.map(d => d.shifts),
          borderColor: C.orange, backgroundColor: 'transparent',
          borderWidth: 2, pointRadius: 3, tension: 0.3, yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: scaleX(''),
        y: { ...scaleY('Hours'), position: 'left' },
        y1: { ...scaleY('Shifts'), position: 'right', grid: { display: false } }
      }
    }
  });

  document.getElementById('db3-insight').innerHTML = `
    <h4>Key Finding</h4>
    <p>The combined business generated <span class="green-text">${fmtCurrency(totalNetSc)}</span> in net revenue (S−C) over 26 months,
    with total sales of ${fmtCurrency(totalSales)} against ${fmtCurrency(totalCost)} in cost.
    IIBS contributes a larger share of net revenue, but both schools draw from the same
    <span class="highlight-text">${fmt(avgHours, 0)} monthly hours</span> and ${fmt(avgShifts, 0)} shifts on average.
    The mROI overlay shows that Rosen often achieves a higher multiple per dollar spent, highlighting efficiency differences
    between the two accounts.</p>
  `;
}

// ===== DB4: Zero-Sum Shared Rep Bandwidth =====
function renderDB4() {
  const kpiRow = document.getElementById('db4-kpis');
  kpiRow.innerHTML = '';
  const avgOverlap = avg(D.map(d => d.overlap_count));
  const avgRPct = avg(D.map(d => d.r_pct_top));
  const avgIPct = avg(D.map(d => d.i_pct_top));
  const avgTopCount = avg(D.map(d => (d.r_top_count || 0) + (d.i_top_count || 0)));

  kpiRow.appendChild(createKPI('Avg Shared Reps', fmt(avgTopCount, 1), 'Combined top reps serving both', false, ''));
  kpiRow.appendChild(createKPI('Avg Overlap/Month', fmt(avgOverlap, 1), 'Reps serving both schools', true, 'accent'));
  kpiRow.appendChild(createKPI('Avg Rosen % Top', fmtPct(avgRPct), 'Leads contacted by top reps', false, 'teal'));
  kpiRow.appendChild(createKPI('Avg IIBS % Top', fmtPct(avgIPct), 'Leads contacted by top reps', false, 'purple'));

  // Main dual bar
  new Chart(document.getElementById('db4-dual-bar'), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Rosen % Top Reps',
          data: D.map(d => d.r_pct_top),
          backgroundColor: C.tealDim,
          borderColor: C.teal,
          borderWidth: 1.5, borderRadius: 4, barPercentage: 0.8, categoryPercentage: 0.7
        },
        {
          label: 'IIBS % Top Reps',
          data: D.map(d => d.i_pct_top),
          backgroundColor: C.purpleDim,
          borderColor: C.purple,
          borderWidth: 1.5, borderRadius: 4, barPercentage: 0.8, categoryPercentage: 0.7
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: scaleX(''),
        y: scaleY('% Leads by Top Reps', scalePct)
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${fmtPct(ctx.parsed.y)}`
          }
        }
      }
    }
  });

  // Scatter: inverse correlation
  new Chart(document.getElementById('db4-scatter'), {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Monthly Observation',
        data: D.map(d => ({ x: d.r_pct_top, y: d.i_pct_top })),
        backgroundColor: C.blueDim,
        borderColor: C.blue,
        borderWidth: 1.5, pointRadius: 6, pointHoverRadius: 8
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { ...scaleY('Rosen % Top Reps', scalePct), position: 'bottom', grid: { color: C.gridLine } },
        y: scaleY('IIBS % Top Reps', scalePct)
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => {
              const idx = ctx.dataIndex;
              return [
                `${D[idx].short}`,
                `Rosen: ${fmtPct(ctx.parsed.x)}`,
                `IIBS: ${fmtPct(ctx.parsed.y)}`
              ];
            }
          }
        }
      }
    }
  });

  // Overlap count line
  const ctx3 = document.getElementById('db4-overlap').getContext('2d');
  new Chart(ctx3, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Overlap Count',
        data: D.map(d => d.overlap_count),
        borderColor: C.orange,
        backgroundColor: makeGradient(ctx3, C.orange, 0.3, 0),
        borderWidth: 2.5, pointRadius: 4, tension: 0.3, fill: true
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { x: scaleX(''), y: { ...scaleY('# Reps'), beginAtZero: true } },
      plugins: { legend: { display: false } }
    }
  });

  // Stacked area: retry share
  const ctx4 = document.getElementById('db4-retry').getContext('2d');
  new Chart(ctx4, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Rosen Retry Share',
          data: D.map(d => d.r_retry_share),
          borderColor: C.teal,
          backgroundColor: makeGradient(ctx4, C.teal, 0.4, 0.1),
          borderWidth: 2, pointRadius: 2, tension: 0.3, fill: true
        },
        {
          label: 'IIBS Retry Share',
          data: D.map(d => d.i_retry_share),
          borderColor: C.purple,
          backgroundColor: makeGradient(ctx4, C.purple, 0.4, 0.1),
          borderWidth: 2, pointRadius: 2, tension: 0.3, fill: true
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: scaleX(''),
        y: { ...scaleY('% Share of Retries', scalePct), stacked: true, min: 0, max: 100 }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${fmtPct(ctx.parsed.y)}`
          }
        }
      }
    }
  });

  document.getElementById('db4-insight').innerHTML = `
    <h4>Key Finding</h4>
    <p>The dual bar chart reveals a <span class="highlight-text">clear inverse pattern</span>: when Rosen's top rep engagement rises,
    IIBS's tends to drop, and vice versa. Average overlap of <span class="green-text">${fmt(avgOverlap, 1)} reps/month</span>
    confirms that the same reps serve both schools. The retry share (stacked area) always sums to 100%, visually proving
    that bandwidth is finite. Rosen averages ${fmtPct(avgRPct)} top rep engagement while IIBS averages ${fmtPct(avgIPct)} —
    the allocation of shared resources directly determines which account gets more attention.</p>
  `;
}

// ===== DB5: Fair Context — Rosen Inputs vs Outputs =====
function renderDB5() {
  const kpiRow = document.getElementById('db5-kpis');
  kpiRow.innerHTML = '';
  const avgHours = avg(D.map(d => d.hours));
  const avgShifts = avg(D.map(d => d.shifts));
  const avgPctTop = avg(D.map(d => d.r_pct_top));
  const avgNetRev = avg(D.map(d => d.r_net_sc));

  kpiRow.appendChild(createKPI('Avg Hours', fmt(avgHours, 0), 'Monthly rep hours', false, ''));
  kpiRow.appendChild(createKPI('Avg Shifts', fmt(avgShifts, 0), 'Monthly shifts', false, ''));
  kpiRow.appendChild(createKPI('Avg % Top Reps', fmtPct(avgPctTop), 'Rosen top rep engagement', false, 'teal'));
  kpiRow.appendChild(createKPI('Avg Net Rev (S−C)', fmtCurrency(avgNetRev), 'Rosen monthly average', true, 'green'));

  // Main: Hours bars + Net Rev Post Churn line
  const ctx1 = document.getElementById('db5-main').getContext('2d');
  new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Hours',
          data: D.map(d => d.hours),
          backgroundColor: C.tealDim,
          borderColor: C.teal,
          borderWidth: 1.5, borderRadius: 6, barPercentage: 0.6, yAxisID: 'y'
        },
        {
          label: 'Net Rev Post Churn',
          data: D.map(d => d.r_net_churn),
          type: 'line',
          borderColor: C.green,
          backgroundColor: makeGradient(ctx1, C.green, 0.2, 0),
          borderWidth: 3, pointRadius: 4, tension: 0.3, fill: true, yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: scaleX(''),
        y: { ...scaleY('Hours', v => v.toLocaleString()), position: 'left' },
        y1: { ...scaleY('Net Rev Post Churn ($)', scaleDollar), position: 'right', grid: { display: false } }
      }
    }
  });

  // Scatter: Hours vs Net Rev
  new Chart(document.getElementById('db5-scatter-hours'), {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Month',
        data: D.map(d => ({ x: d.hours, y: d.r_net_sc })),
        backgroundColor: C.tealDim,
        borderColor: C.teal,
        borderWidth: 1.5, pointRadius: 6, pointHoverRadius: 8
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { ...scaleY('Hours'), position: 'bottom', grid: { color: C.gridLine } },
        y: scaleY('Net Rev (S−C)', scaleDollar)
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => {
              const i = ctx.dataIndex;
              return [`${D[i].short}`, `Hours: ${D[i].hours}`, `Net Rev: ${fmtCurrency(ctx.parsed.y)}`];
            }
          }
        }
      }
    }
  });

  // Scatter: % Top Reps vs Net Rev
  new Chart(document.getElementById('db5-scatter-reps'), {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Month',
        data: D.map(d => ({ x: d.r_pct_top, y: d.r_net_sc })),
        backgroundColor: C.purpleDim,
        borderColor: C.purple,
        borderWidth: 1.5, pointRadius: 6, pointHoverRadius: 8
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { ...scaleY('% Top Reps', scalePct), position: 'bottom', grid: { color: C.gridLine } },
        y: scaleY('Net Rev (S−C)', scaleDollar)
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => {
              const i = ctx.dataIndex;
              return [`${D[i].short}`, `% Top: ${fmtPct(D[i].r_pct_top)}`, `Net Rev: ${fmtCurrency(ctx.parsed.y)}`];
            }
          }
        }
      }
    }
  });

  // Leads + Retries
  const ctx4 = document.getElementById('db5-leads').getContext('2d');
  new Chart(ctx4, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Leads Supplied',
          data: D.map(d => d.r_leads),
          borderColor: C.blue,
          backgroundColor: makeGradient(ctx4, C.blue, 0.2, 0),
          borderWidth: 2.5, pointRadius: 3, tension: 0.3, fill: true, yAxisID: 'y'
        },
        {
          label: 'Retries',
          data: D.map(d => d.r_retries),
          borderColor: C.orange,
          backgroundColor: 'transparent',
          borderWidth: 2, pointRadius: 3, tension: 0.3, yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: scaleX(''),
        y: { ...scaleY('Leads'), position: 'left' },
        y1: { ...scaleY('Retries'), position: 'right', grid: { display: false } }
      }
    }
  });

  document.getElementById('db5-insight').innerHTML = `
    <h4>Key Finding</h4>
    <p>The correlation between <span class="highlight-text">operational inputs and revenue outputs</span> is visually clear:
    the hours bar chart and Net Rev Post Churn line move together. Scatter plots confirm positive relationships —
    more hours and higher top rep engagement correspond to higher net revenue. Rosen averages
    <span class="green-text">${fmtCurrency(avgNetRev)}</span> net revenue when given ${fmt(avgHours, 0)} hours and
    ${fmtPct(avgPctTop)} top rep engagement. When these inputs drop, results follow. This isn't about excuses — it's about
    <span class="highlight-text">resource allocation driving outcomes</span>.</p>
  `;
}

// ===== DB6: CEO Strategic Overview =====
function renderDB6() {
  const kpiRow = document.getElementById('db6-kpis');
  kpiRow.innerHTML = '';
  const rNetAvg = avg(D.map(d => d.r_net_sc));
  const iNetAvg = avg(D.map(d => d.i_net_sc));
  const rMroiAvg = avg(D.map(d => d.r_mroi));
  const iMroiAvg = avg(D.map(d => d.i_mroi));
  const rRoasAvg = avg(D.map(d => d.r_roas));
  const iRoasAvg = avg(D.map(d => d.i_roas));

  kpiRow.appendChild(createKPI('Rosen Avg Net Rev', fmtCurrency(rNetAvg), 'vs IIBS ' + fmtCurrency(iNetAvg), false, 'teal'));
  kpiRow.appendChild(createKPI('IIBS Avg Net Rev', fmtCurrency(iNetAvg), 'vs Rosen ' + fmtCurrency(rNetAvg), false, 'purple'));
  kpiRow.appendChild(createKPI('Rosen mROI', fmt(rMroiAvg, 2) + 'x', 'vs IIBS ' + fmt(iMroiAvg, 2) + 'x', false, ''));
  kpiRow.appendChild(createKPI('IIBS mROI', fmt(iMroiAvg, 2) + 'x', 'vs Rosen ' + fmt(rMroiAvg, 2) + 'x', false, ''));
  kpiRow.appendChild(createKPI('Rosen ROAS', fmt(rRoasAvg, 2) + 'x', '', false, ''));
  kpiRow.appendChild(createKPI('IIBS ROAS', fmt(iRoasAvg, 2) + 'x', '', false, ''));

  function overlayChart(canvasId, rKey, iKey, yLabel, yCb) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Rosen',
            data: D.map(d => d[rKey]),
            borderColor: C.teal,
            backgroundColor: makeGradient(ctx, C.teal, 0.15, 0),
            borderWidth: 2.5, pointRadius: 3, tension: 0.3, fill: true
          },
          {
            label: 'IIBS',
            data: D.map(d => d[iKey]),
            borderColor: C.purple,
            backgroundColor: makeGradient(ctx, C.purple, 0.15, 0),
            borderWidth: 2.5, pointRadius: 3, tension: 0.3, fill: true
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: scaleX(''),
          y: scaleY(yLabel, yCb)
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ${yCb ? yCb(ctx.parsed.y) : ctx.parsed.y}`
            }
          }
        }
      }
    });
  }

  overlayChart('db6-netrev', 'r_net_sc', 'i_net_sc', 'Net Revenue (S−C)', scaleDollar);
  overlayChart('db6-mroi', 'r_mroi', 'i_mroi', 'mROI', v => v + 'x');
  overlayChart('db6-sales', 'r_sales', 'i_sales', 'Sales Revenue', scaleDollar);
  overlayChart('db6-cost', 'r_cost', 'i_cost', 'Media Cost', scaleDollar);

  document.getElementById('db6-insight').innerHTML = `
    <h4>Key Finding</h4>
    <p>Side-by-side comparison reveals that IIBS generates higher absolute revenue but at higher cost.
    Rosen averages <span class="green-text">${fmtCurrency(rNetAvg)}</span> net revenue vs IIBS at
    <span class="highlight-text">${fmtCurrency(iNetAvg)}</span>. However, Rosen achieves a higher mROI
    (<span class="green-text">${fmt(rMroiAvg, 2)}x</span> vs ${fmt(iMroiAvg, 2)}x) — getting more return per marketing dollar.
    Both accounts share the same rep pool, meaning their trajectories are fundamentally linked:
    resources given to one are taken from the other.</p>
  `;
}

// ===== DB7: Top Reps Revenue Correlation =====
let db7Account = 'rosen';

function renderDB7() {
  renderDB7Inner();
  // Sub-tab switching
  document.querySelectorAll('#db7-subtabs .sub-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#db7-subtabs .sub-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      db7Account = btn.dataset.subtab;
      destroyChartsIn('db7');
      renderDB7Inner();
    });
  });
}

function renderDB7Inner() {
  const isR = db7Account === 'rosen';
  const prefix = isR ? 'r_' : 'i_';
  const name = isR ? 'Rosen' : 'IIBS';
  const threshold = isR ? 65 : 50;
  const pctKey = prefix + 'pct_top';
  const netKey = prefix + 'net_sc';

  const kpiRow = document.getElementById('db7-kpis');
  kpiRow.innerHTML = '';

  const avgPct = avg(D.map(d => d[pctKey]));
  const highMonths = D.filter(d => d[pctKey] >= threshold);
  const lowMonths = D.filter(d => d[pctKey] < threshold);
  const highAvgRev = highMonths.length ? avg(highMonths.map(d => d[netKey])) : 0;
  const lowAvgRev = lowMonths.length ? avg(lowMonths.map(d => d[netKey])) : 0;
  const delta = highAvgRev - lowAvgRev;

  kpiRow.appendChild(createKPI(`Avg % Top Reps`, fmtPct(avgPct), name, false, 'teal'));
  kpiRow.appendChild(createKPI(`Months ≥${threshold}%`, highMonths.length.toString(), `of 26 months`, false, 'green'));
  kpiRow.appendChild(createKPI('Avg Rev (High)', fmtCurrency(highAvgRev), `When ≥${threshold}% top reps`, true, 'green'));
  kpiRow.appendChild(createKPI('Avg Rev (Low)', fmtCurrency(lowAvgRev), `When <${threshold}% top reps`, false, 'orange'));
  kpiRow.appendChild(createKPI('Delta', fmtCurrency(delta), 'High vs Low engagement', false, 'accent'));

  // Main: % Top Reps (area) + Net Rev (line)
  const ctx1 = document.getElementById('db7-main').getContext('2d');
  new Chart(ctx1, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: '% Top Reps',
          data: D.map(d => d[pctKey]),
          borderColor: C.teal,
          backgroundColor: makeGradient(ctx1, C.teal, 0.4, 0.05),
          borderWidth: 2, pointRadius: 3, tension: 0.3, fill: true, yAxisID: 'y'
        },
        {
          label: 'Net Rev (S−C)',
          data: D.map(d => d[netKey]),
          borderColor: C.green,
          backgroundColor: 'transparent',
          borderWidth: 3, pointRadius: 4, tension: 0.3, fill: false, yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: scaleX(''),
        y: { ...scaleY('% Top Reps', scalePct), position: 'left', beginAtZero: true },
        y1: { ...scaleY('Net Rev (S−C)', scaleDollar), position: 'right', grid: { display: false } }
      }
    }
  });

  // Scatter with trend
  const scatterData = D.map(d => ({ x: d[pctKey], y: d[netKey] }));
  // Simple linear regression for trend
  const xVals = D.map(d => d[pctKey]);
  const yVals = D.map(d => d[netKey]);
  const n = xVals.length;
  const xMean = avg(xVals);
  const yMean = avg(yVals);
  const slope = xVals.reduce((s, x, i) => s + (x - xMean) * (yVals[i] - yMean), 0) /
                xVals.reduce((s, x) => s + (x - xMean) ** 2, 0);
  const intercept = yMean - slope * xMean;
  const xMin = Math.min(...xVals);
  const xMax = Math.max(...xVals);
  const trendData = [{ x: xMin, y: slope * xMin + intercept }, { x: xMax, y: slope * xMax + intercept }];

  new Chart(document.getElementById('db7-scatter'), {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Monthly',
          data: scatterData,
          backgroundColor: C.tealDim,
          borderColor: C.teal,
          borderWidth: 1.5, pointRadius: 6
        },
        {
          label: 'Trend',
          data: trendData,
          type: 'line',
          borderColor: C.orange,
          borderWidth: 2, borderDash: [6, 4],
          pointRadius: 0, fill: false
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { ...scaleY('% Top Reps', scalePct), position: 'bottom', grid: { color: C.gridLine } },
        y: scaleY('Net Rev (S−C)', scaleDollar)
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => {
              if (ctx.datasetIndex === 1) return 'Trend line';
              const i = ctx.dataIndex;
              return [`${D[i].short}`, `% Top: ${fmtPct(ctx.parsed.x)}`, `Net Rev: ${fmtCurrency(ctx.parsed.y)}`];
            }
          }
        }
      }
    }
  });

  // Top 10 months by net rev
  const sorted = D.map((d, i) => ({ ...d, idx: i })).sort((a, b) => b[netKey] - a[netKey]).slice(0, 10);
  new Chart(document.getElementById('db7-top10'), {
    type: 'bar',
    data: {
      labels: sorted.map(d => d.short),
      datasets: [{
        label: 'Net Rev (S−C)',
        data: sorted.map(d => d[netKey]),
        backgroundColor: sorted.map(d => {
          const pct = d[pctKey];
          if (pct >= threshold) return C.greenDim;
          return C.orangeDim;
        }),
        borderColor: sorted.map(d => d[pctKey] >= threshold ? C.green : C.orange),
        borderWidth: 1.5, borderRadius: 6, barPercentage: 0.7
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      indexAxis: 'y',
      scales: {
        x: scaleY('Net Rev (S−C)', scaleDollar),
        y: { ...scaleX(''), grid: { display: false } }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const d = sorted[ctx.dataIndex];
              return [`Net Rev: ${fmtCurrency(ctx.parsed.x)}`, `% Top Reps: ${fmtPct(d[pctKey])}`];
            }
          }
        }
      }
    }
  });

  const insightEl = document.getElementById('db7-insight');
  insightEl.innerHTML = `
    <h4>Key Finding — ${name}</h4>
    <p>When ${name} has <span class="highlight-text">≥${threshold}% top rep engagement</span> (${highMonths.length} months),
    average net revenue is <span class="green-text">${fmtCurrency(highAvgRev)}</span>.
    When engagement drops below ${threshold}%, revenue averages only ${fmtCurrency(lowAvgRev)} —
    a delta of <span class="highlight-text">${fmtCurrency(delta)}</span>.
    The area chart shows how the two metrics track each other, and the scatter plot with trend line confirms
    the positive correlation. The top 10 revenue months are color-coded: <span class="green-text">green = high engagement</span>,
    <span style="color:${C.orange}">orange = low engagement</span>.</p>
  `;
}

// ===== DB8: Monthly Intelligence Briefing =====
let db8Account = 'rosen';

function renderDB8() {
  renderDB8Inner();
  document.querySelectorAll('#db8-subtabs .sub-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#db8-subtabs .sub-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      db8Account = btn.dataset.subtab;
      destroyChartsIn('db8');
      renderDB8Inner();
    });
  });
}

function renderDB8Inner() {
  const acct = db8Account;
  let netChurnKey, netScKey, mroiKey, roasKey, salesKey, label;

  if (acct === 'rosen') {
    netChurnKey = 'r_net_churn'; netScKey = 'r_net_sc'; mroiKey = 'r_mroi'; roasKey = 'r_roas'; salesKey = 'r_sales'; label = 'Rosen';
  } else if (acct === 'iibs') {
    netChurnKey = 'i_net_churn'; netScKey = 'i_net_sc'; mroiKey = 'i_mroi'; roasKey = 'i_roas'; salesKey = 'i_sales'; label = 'IIBS';
  } else {
    // Combined: use c_net_sc for net, and average mroi/roas from both
    netChurnKey = null; netScKey = 'c_net_sc'; mroiKey = null; roasKey = null; salesKey = 'c_sales'; label = 'Combined';
  }

  const kpiRow = document.getElementById('db8-kpis');
  kpiRow.innerHTML = '';

  // Get net churn values (or c_net_sc for combined)
  let netVals;
  if (acct === 'combined') {
    netVals = D.map(d => d.c_net_sc);
  } else {
    netVals = D.map(d => d[netChurnKey]);
  }
  const avgNet = avg(netVals);
  const bestIdx = netVals.indexOf(Math.max(...netVals));
  const worstIdx = netVals.indexOf(Math.min(...netVals));
  const last3 = avg(netVals.slice(-3));
  const prior3 = avg(netVals.slice(-6, -3));
  const trendDir = last3 > prior3 ? '↑ Improving' : '↓ Declining';
  const trendColor = last3 > prior3 ? 'green' : 'orange';

  kpiRow.appendChild(createKPI('Best Month', D[bestIdx].short, fmtCurrency(netVals[bestIdx]), true, 'green'));
  kpiRow.appendChild(createKPI('Worst Month', D[worstIdx].short, fmtCurrency(netVals[worstIdx]), false, 'orange'));
  kpiRow.appendChild(createKPI('Avg Net Rev', fmtCurrency(avgNet), acct === 'combined' ? 'S−C' : 'Post Churn', false, 'accent'));
  kpiRow.appendChild(createKPI('Trend (Last 3 vs Prior 3)', trendDir, `${fmtCurrency(last3)} vs ${fmtCurrency(prior3)}`, false, trendColor));

  // Trend line
  const ctx1 = document.getElementById('db8-trend').getContext('2d');
  new Chart(ctx1, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: acct === 'combined' ? 'Net Rev (S−C)' : 'Net Rev Post Churn',
        data: netVals,
        borderColor: C.green,
        backgroundColor: makeGradient(ctx1, C.green, 0.3, 0),
        borderWidth: 3, pointRadius: 4, tension: 0.3, fill: true
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: scaleX(''),
        y: scaleY(acct === 'combined' ? 'Net Rev (S−C)' : 'Net Rev Post Churn', scaleDollar)
      },
      plugins: {
        tooltip: {
          callbacks: { label: ctx => `${ctx.dataset.label}: ${fmtCurrency(ctx.parsed.y)}` }
        }
      }
    }
  });

  // mROI + ROAS trends
  const ctx2 = document.getElementById('db8-ratios').getContext('2d');
  if (acct !== 'combined') {
    new Chart(ctx2, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'mROI',
            data: D.map(d => d[mroiKey]),
            borderColor: C.blue,
            backgroundColor: makeGradient(ctx2, C.blue, 0.15, 0),
            borderWidth: 2.5, pointRadius: 3, tension: 0.3, fill: true
          },
          {
            label: 'ROAS',
            data: D.map(d => d[roasKey]),
            borderColor: C.orange,
            backgroundColor: 'transparent',
            borderWidth: 2, pointRadius: 3, tension: 0.3
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: scaleX(''),
          y: scaleY('Ratio', v => v + 'x')
        }
      }
    });
  } else {
    // Combined: show both Rosen + IIBS mROI
    new Chart(ctx2, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Rosen mROI',
            data: D.map(d => d.r_mroi),
            borderColor: C.teal, backgroundColor: makeGradient(ctx2, C.teal, 0.15, 0),
            borderWidth: 2.5, pointRadius: 3, tension: 0.3, fill: true
          },
          {
            label: 'IIBS mROI',
            data: D.map(d => d.i_mroi),
            borderColor: C.purple, backgroundColor: makeGradient(ctx2, C.purple, 0.15, 0),
            borderWidth: 2.5, pointRadius: 3, tension: 0.3, fill: true
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: { x: scaleX(''), y: scaleY('mROI', v => v + 'x') }
      }
    });
  }

  // Horizontal bar: all 26 months sorted by net rev
  const sorted = D.map((d, i) => ({ short: d.short, val: netVals[i], idx: i }))
    .sort((a, b) => a.val - b.val); // ascending for horizontal bars (top = best)

  const maxVal = Math.max(...netVals);
  const minVal = Math.min(...netVals);
  const range = maxVal - minVal || 1;

  new Chart(document.getElementById('db8-rank'), {
    type: 'bar',
    data: {
      labels: sorted.map(s => s.short),
      datasets: [{
        label: acct === 'combined' ? 'Net Rev (S−C)' : 'Net Rev Post Churn',
        data: sorted.map(s => s.val),
        backgroundColor: sorted.map(s => {
          const ratio = (s.val - minVal) / range;
          if (ratio < 0.25) return 'rgba(255, 69, 58, 0.35)';
          if (ratio < 0.5) return 'rgba(255, 159, 10, 0.3)';
          if (ratio < 0.75) return 'rgba(255, 214, 10, 0.25)';
          return 'rgba(48, 209, 88, 0.35)';
        }),
        borderColor: sorted.map(s => {
          const ratio = (s.val - minVal) / range;
          if (ratio < 0.25) return C.red;
          if (ratio < 0.5) return C.orange;
          if (ratio < 0.75) return C.yellow;
          return C.green;
        }),
        borderWidth: 1.5, borderRadius: 4, barPercentage: 0.7
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      indexAxis: 'y',
      scales: {
        x: scaleY(acct === 'combined' ? 'Net Rev (S−C)' : 'Net Rev Post Churn', scaleDollar),
        y: { ...scaleX(''), grid: { display: false }, ticks: { font: { size: 10 } } }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${fmtCurrency(ctx.parsed.x)}`
          }
        }
      }
    }
  });

  document.getElementById('db8-insight').innerHTML = `
    <h4>Intelligence Summary — ${label}</h4>
    <p>Best performing month was <span class="green-text">${D[bestIdx].short}</span> at ${fmtCurrency(netVals[bestIdx])},
    while the lowest was ${D[worstIdx].short} at ${fmtCurrency(netVals[worstIdx])}.
    The average across all 26 months is <span class="highlight-text">${fmtCurrency(avgNet)}</span>.
    Recent trend is <span class="${trendColor}-text">${trendDir.toLowerCase()}</span> — the last 3 months average
    ${fmtCurrency(last3)} compared to ${fmtCurrency(prior3)} for the prior 3.
    The horizontal bar chart provides a quick visual ranking of all months by net revenue, colored from
    red (lowest) through yellow to green (highest).</p>
  `;
}

// ===== RENDERER REGISTRY =====
const renderers = {
  db1: renderDB1,
  db2: renderDB2,
  db3: renderDB3,
  db4: renderDB4,
  db5: renderDB5,
  db6: renderDB6,
  db7: renderDB7,
  db8: renderDB8
};

// Initial render
renderTab('db1');
