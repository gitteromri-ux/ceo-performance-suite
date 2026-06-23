/* ============================================================
   LONGEVITY LIFE ACADEMY — CEO Daily Marketing/Sales Snapshot
   Period: June 23–31 & July 2026
   CPL assumptions: High-Intent $26 · Normal/Broad $17 · Bio-Age $30
   All figures linked to real Meta CRM ad set IDs.
   ============================================================ */
var LLA_CEO = {
  meta: {
    period_label: "Jun 23 – Jul 31, 2026",
    june_label: "Jun 23–30",
    july_label: "July (full)",
    cpl: { high: 26, normal: 17, bio: 30 },
    crm_base: "https://adsmanager.facebook.com/adsmanager/manage/adsets?act=&selected_adset_ids=",
    updated: "June 23, 2026",
    // enrollment economics (planning assumptions)
    lead_to_call: 0.40,        // 40% of leads booked to a sales call
    call_to_enroll: 0.18,      // 18% of calls convert to enrollment
    course_value: 1350         // avg revenue per enrollment ($)
  },

  // ── REAL CAMPAIGN AD SETS (with CRM IDs + strategic role) ──
  // leads = budget / cpl  (rounded in UI)
  adsets: [
    { id:"108776", name:"Adset 4_All_All_CPM_#108776", short:"Adset 4", status:"New",
      budget:550, cpl:26, age:"35–64", intent:"High Intent", socio:"Top 5/10/10–25% ZIP (Affluent)",
      form:"Form 2 — $289/month", price:"Monthly", dest:"Lead Form", bio:false, accent:"#10B981", flagship:true,
      role:"Flagship affluent acquisition", issue:"Carries 29% of spend — primary high-intent, income-filtered engine driving the bulk of qualified monthly-price leads." },
    { id:"108719", name:"LLA Adset 2_All_All_CPM_#108719", short:"Adset 2", status:"Existing",
      budget:470, cpl:17, age:"35–64", intent:"Broad", socio:"Broad (no income filter)",
      form:"Form 1 — $83/Session", price:"Per-Session", dest:"Lead Form", bio:false, accent:"#06B6D4", flagship:false,
      role:"Volume / broad reach", issue:"Largest broad spend with no income filter — cheap leads but unqualified mix; candidate to trim under the 80/20 pricing shift." },
    { id:"108775", name:"Adset 3_All_All_CPM_#108775", short:"Adset 3", status:"New",
      budget:350, cpl:26, age:"35–64", intent:"High Intent", socio:"Top 5/10/10–25% ZIP (Affluent)",
      form:"Form 2 — $289/month", price:"Monthly", dest:"Lead Form", bio:false, accent:"#34D399", flagship:false,
      role:"Affluent acquisition (scale-twin)", issue:"Second affluent high-intent set — same audience logic as #108776, validating the income-filtered thesis at scale." },
    { id:"108718", name:"LLA Adset 1_All_All_CPM_#108718", short:"Adset 1", status:"Existing",
      budget:320, cpl:17, age:"35–65+", intent:"Broad", socio:"Broad (no income filter)",
      form:"Form 1 — $83/Session", price:"Per-Session", dest:"Lead Form", bio:false, accent:"#F59E0B", flagship:false,
      role:"Legacy broad / older age", issue:"Widest age (35–65+) with no filter — includes lower-intent retirees; lowest-priority spend, reallocate toward affluent sets." },
    { id:"108777", name:"Adset 1_All_All_CPM_#108777", short:"Bio-Age", status:"New",
      budget:180, cpl:30, age:"35–65+", intent:"Broad (Curiosity)", socio:"Broad (no income filter)",
      form:"Website LP — “What's your bio age?”", price:"Bio-Age Hook", dest:"Website LP", bio:true, accent:"#A78BFA", flagship:false,
      role:"Top-of-funnel curiosity test", issue:"Highest CPL ($30) — experimental bio-age hook to website LP; measures whether curiosity entry beats native forms before scaling." }
  ],

  // ── 80 / 20 PRICING STRATEGY TARGET (CEO directive) ──
  pricing_target: {
    pool: 1690,
    monthly:    { pct:80, budget:1352, cpl:26, leads:52 },
    per_session:{ pct:20, budget:338,  cpl:17, leads:20 },
    note: "CEO directive: shift presentation weight to the clear $289/month price (80%) and keep only 20% on the per-session ($83) framing."
  }
};

// ── DERIVED TOTALS ──
LLA_CEO.totals = (function(){
  const a = LLA_CEO.adsets;
  const budget = a.reduce((s,x)=>s+x.budget,0);
  const leads  = a.reduce((s,x)=>s+x.budget/x.cpl,0);
  const blendedCpl = budget/leads;
  return { budget, leads: Math.round(leads), leads_raw: leads, blendedCpl };
})();

// ── MACRO GROUPINGS (budget + leads + %) ──
LLA_CEO.groups = (function(){
  const a = LLA_CEO.adsets, T = LLA_CEO.totals;
  function g(keyFn){
    const m = {};
    a.forEach(x=>{ const k=keyFn(x); (m[k]=m[k]||{budget:0,leads:0,ids:[]});
      m[k].budget+=x.budget; m[k].leads+=x.budget/x.cpl; m[k].ids.push(x.id); });
    return Object.entries(m).map(([k,v])=>({
      label:k, budget:v.budget, leads:+v.leads.toFixed(1),
      pctBudget:Math.round(v.budget/T.budget*100),
      pctLeads:Math.round(v.leads/T.leads_raw*100), ids:v.ids
    })).sort((x,y)=>y.budget-x.budget);
  }
  return {
    age:    g(x=> x.age==="35–64" ? "35–64 (core buyer)" : "35–65+ (incl. older)"),
    intent: g(x=> x.intent.startsWith("High") ? "High Intent" : "Broad"),
    socio:  g(x=> x.socio.includes("Affluent") ? "Affluent (Top ZIP income)" : "Broad (no income filter)"),
    price:  g(x=> x.bio ? "Bio-Age Hook" : (x.price==="Monthly" ? "Monthly $289" : "Per-Session $83")),
    status: g(x=> x.status)
  };
})();

// ── PERIOD PROJECTIONS (with enrollment funnel) ──
LLA_CEO.periods = (function(){
  const T = LLA_CEO.totals, M = LLA_CEO.meta;
  const mk = (days,label)=>{
    const leads = T.leads_raw*days;
    const calls = leads*M.lead_to_call;
    const enrolls = calls*M.call_to_enroll;
    const revenue = enrolls*M.course_value;
    const spend = T.budget*days;
    return { days, label,
      budget: spend, leads: Math.round(leads),
      calls: Math.round(calls), enrolls: Math.round(enrolls),
      revenue: Math.round(revenue), roas: +(revenue/spend).toFixed(2) };
  };
  return { daily: mk(1,"Daily run-rate"), june: mk(8,"Jun 23–30"), july: mk(31,"July"), full: mk(39,"Full Period") };
})();

// ── DAILY LEAD QUOTA SCHEDULE (per campaign, per day) ──
LLA_CEO.daily_quota = (function(){
  const a = LLA_CEO.adsets, T = LLA_CEO.totals;
  return {
    perCampaign: a.map(x=>({ id:x.id, short:x.short, accent:x.accent, leads:+(x.budget/x.cpl).toFixed(1) }))
                   .sort((p,q)=>q.leads-p.leads),
    total: T.leads
  };
})();

// ── HEADLINE ANALYTICS (for KPI + insight cards) ──
LLA_CEO.analytics = (function(){
  const T = LLA_CEO.totals, G = LLA_CEO.groups, A = LLA_CEO.adsets;
  const hi = G.intent.find(g=>g.label==="High Intent");
  const aff = G.socio.find(g=>g.label.startsWith("Affluent"));
  const core = G.age.find(g=>g.label.startsWith("35–64"));
  const monthly = G.price.find(g=>g.label.startsWith("Monthly"));
  const affLeads = aff.leads;
  const costPerAffluentLead = aff.budget/affLeads;
  return {
    highIntentPct: hi.pctBudget, highIntentBudget: hi.budget, highIntentLeads: Math.round(hi.leads),
    affluentPct: aff.pctBudget, affluentBudget: aff.budget, affluentLeads: Math.round(affLeads),
    corePct: core.pctBudget, coreBudget: core.budget, coreLeads: Math.round(core.leads),
    monthlyPct: monthly.pctBudget,
    costPerAffluentLead: +costPerAffluentLead.toFixed(2),
    blendedCpl: +T.blendedCpl.toFixed(2),
    newSpend: G.status.find(g=>g.label==="New").budget,
    newPct: G.status.find(g=>g.label==="New").pctBudget
  };
})();
