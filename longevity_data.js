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
    updated: "June 23, 2026"
  },

  // ── REAL CAMPAIGN AD SETS (with CRM IDs) ──
  // leads = budget / cpl  (rounded in UI)
  adsets: [
    { id:"108776", name:"Adset 4_All_All_CPM_#108776", short:"Adset 4", status:"New",
      budget:550, cpl:26, age:"35–64", intent:"High Intent", socio:"Top 5/10/10–25% ZIP (Affluent)",
      form:"Form 2 — $289/month", price:"Monthly", dest:"Lead Form", bio:false, accent:"#10B981", flagship:true },
    { id:"108719", name:"LLA Adset 2_All_All_CPM_#108719", short:"Adset 2", status:"Existing",
      budget:470, cpl:17, age:"35–64", intent:"Broad", socio:"Broad (no income filter)",
      form:"Form 1 — $83/Session", price:"Per-Session", dest:"Lead Form", bio:false, accent:"#06B6D4", flagship:false },
    { id:"108775", name:"Adset 3_All_All_CPM_#108775", short:"Adset 3", status:"New",
      budget:350, cpl:26, age:"35–64", intent:"High Intent", socio:"Top 5/10/10–25% ZIP (Affluent)",
      form:"Form 2 — $289/month", price:"Monthly", dest:"Lead Form", bio:false, accent:"#10B981", flagship:false },
    { id:"108718", name:"LLA Adset 1_All_All_CPM_#108718", short:"Adset 1", status:"Existing",
      budget:320, cpl:17, age:"35–65+", intent:"Broad", socio:"Broad (no income filter)",
      form:"Form 1 — $83/Session", price:"Per-Session", dest:"Lead Form", bio:false, accent:"#F59E0B", flagship:false },
    { id:"108777", name:"Adset 1_All_All_CPM_#108777", short:"Bio-Age", status:"New",
      budget:180, cpl:30, age:"35–65+", intent:"Broad (Curiosity)", socio:"Broad (no income filter)",
      form:"Website LP — “What's your bio age?”", price:"Bio-Age Hook", dest:"Website LP", bio:true, accent:"#A78BFA", flagship:false }
  ],

  // ── 80 / 20 PRICING STRATEGY TARGET (CEO directive) ──
  // Of the lead-form pricing pool ($1,690), 80% behind monthly price, 20% behind per-session.
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
  return { budget, leads: Math.round(leads), leads_raw: leads };
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

// ── PERIOD PROJECTIONS ──
LLA_CEO.periods = (function(){
  const T = LLA_CEO.totals;
  const mk = (days,label)=>({ days, label, budget:T.budget*days, leads:Math.round(T.leads_raw*days) });
  return { june: mk(8,"Jun 23–30"), july: mk(31,"July"), full: mk(39,"Full Period") };
})();
