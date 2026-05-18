var PILOT = {
  meta: {
    name: "Meta",
    color: "#1877F2",
    days: [
      { date:"May 7",  day:1,  spend:52.62,  leads:1,  cpl:52.62 },
      { date:"May 8",  day:2,  spend:136.89, leads:13, cpl:10.53 },
      { date:"May 9",  day:3,  spend:0,       leads:0,  cpl:0 },
      { date:"May 10", day:4,  spend:0,       leads:0,  cpl:0 },
      { date:"May 11", day:5,  spend:161.92,  leads:5,  cpl:32.38 },
      { date:"May 12", day:6,  spend:422.33,  leads:41, cpl:10.30 },
      { date:"May 13", day:7,  spend:351.47,  leads:30, cpl:11.72 },
      { date:"May 14", day:8,  spend:304.37,  leads:36, cpl:8.45 },
      { date:"May 15", day:9,  spend:321.35,  leads:27, cpl:11.90 },
      { date:"May 16", day:10, spend:194.03,  leads:22, cpl:8.82 },
      { date:"May 17", day:11, spend:239.45,  leads:22, cpl:10.88 }
    ],
    total_spend: 2184.43,
    total_leads: 197,
    avg_cpl: 11.09
  },
  google: {
    name: "Google",
    color: "#34A853",
    days: [
      { date:"May 7",  day:1,  spend:0,       leads:0, cpl:0,   ctr:0,    cpc:0 },
      { date:"May 8",  day:2,  spend:57.00,   leads:0, cpl:0,   ctr:5.43, cpc:2.13 },
      { date:"May 9",  day:3,  spend:169.00,  leads:0, cpl:0,   ctr:5.31, cpc:3.09 },
      { date:"May 10", day:4,  spend:217.00,  leads:0, cpl:0,   ctr:3.74, cpc:3.51 },
      { date:"May 11", day:5,  spend:291.00,  leads:2, cpl:145.5,ctr:5.50,cpc:3.51 },
      { date:"May 12", day:6,  spend:78.00,   leads:0, cpl:0,   ctr:null, cpc:null },
      { date:"May 13", day:7,  spend:0,       leads:0, cpl:0,   ctr:null, cpc:null },
      { date:"May 14", day:8,  spend:304.37,  leads:0, cpl:0,   ctr:null, cpc:null },
      { date:"May 15", day:9,  spend:321.35,  leads:1, cpl:321.35,ctr:null,cpc:null },
      { date:"May 16", day:10, spend:194.03,  leads:3, cpl:64.68,ctr:null,cpc:null },
      { date:"May 17", day:11, spend:239.45,  leads:2, cpl:119.73,ctr:null,cpc:null }
    ],
    total_spend: 1871.20,
    total_leads: 8,
    avg_cpl: 233.90
  },
  plan: {
    total_budget: 10000,
    total_leads_goal: 550,
    avg_cpl_goal: 26,
    final_cpl_goal: 15,
    pilot_days: 21,
    start_date: "May 7, 2026",
    end_date: "May 27, 2026",
    weeks: [
      { week:1, days:"May 7-11",  budget:2400,  cpc_plan:2.85, cpl_plan:44,  leads_plan:55,  g_budget:1200, m_budget:1200, actual_spend:1085.43, actual_leads:21,  actual_mroi:0,    actual_revenue:0    },
      { week:2, days:"May 12-17", budget:4000,  cpc_plan:2.45, cpl_plan:36,  leads_plan:142, g_budget:2000, m_budget:2000, actual_spend:2970.00, actual_leads:184, actual_mroi:1.62, actual_revenue:4800 },
      { week:3, days:"May 19-23", budget:3000,  cpc_plan:2.15, cpl_plan:24,  leads_plan:150, g_budget:1500, m_budget:1500, actual_spend:null,    actual_leads:null,actual_mroi:null, actual_revenue:null },
      { week:4, days:"May 24-30", budget:600,   cpc_plan:2.00, cpl_plan:22,  leads_plan:173, g_budget:300,  m_budget:300,  actual_spend:null,    actual_leads:null,actual_mroi:null, actual_revenue:null }
    ]
  },
  funnel: {
    acq_total: 4,
    revenue_total: 4800,
    price_per_sale: 1200,
    contact_rate_target: 0.45,
    acq_contact_rate_target: 0.05,
    long_term_mroi_target: 6.2,
    pre_pilot: [
      { leads:61,  contacted:36, contact_rate:0.59, acq_rate:0.028, acq:1 },
      { leads:53,  contacted:26, contact_rate:0.49, acq_rate:0.038, acq:1 },
      { leads:60,  contacted:21, contact_rate:0.35, acq_rate:0.048, acq:1 },
      { leads:123, contacted:31, contact_rate:0.25, acq_rate:0,     acq:0 },
      { leads:136, contacted:20, contact_rate:0.15, acq_rate:0.05,  acq:1 }
    ]
  }
};
