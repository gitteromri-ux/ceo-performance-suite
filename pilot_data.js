var PILOT = {
  // META ALL-TIME (May 7–22, source: Meta campaign report)
  meta_total: {
    spend: 3370.99, leads: 296, cpl: 11.40,
    impressions: 42356, reach: 22392, cpm: 150.79, cpc: 1.12, ctr: 7.10, clicks: 3010, lpv: 1413
  },
  // GOOGLE (May 7–17, last available)
  google_total: { spend: 1871.20, leads: 8, cpl: 233.90 },
  // COMBINED ACTUALS (W1+W2+W3 — source: Funnel breakdown sheet)
  combined: { spend: 6849.43, leads: 419, cpl: 16.35 },
  // WEEKLY — source: Funnel breakdown sheet (all columns confirmed)
  weeks: [
    { week:1, dates:"May 7–11",  budget:2400, cpl_plan:44, leads_plan:55,
      spend:1085.43, leads:21,  cpl:51.69, contacted:null,  acq:0,   revenue:0,    mroi:0    },
    { week:2, dates:"May 12–17", budget:4000, cpl_plan:36, leads_plan:142,
      spend:2970.00, leads:184, cpl:16.14, contacted:82.8,  acq:4,   revenue:4800, mroi:1.62 },
    { week:3, dates:"May 18–23", budget:3000, cpl_plan:24, leads_plan:150,
      spend:2794.00, leads:209, cpl:13.37, contacted:94.05, acq:4,   revenue:4800, mroi:1.72 },
    { week:4, dates:"May 24–30", budget:3000, cpl_plan:15, leads_plan:200,
      spend:null,    leads:null,cpl:null,  contacted:null,  acq:null,revenue:null, mroi:null }
  ],
  // DAILY META DATA (May 7–17 with actuals; May 18+ pending)
  meta_days: [
    { date:"May 7",  leads:1,  spend:52.62,  cpl:52.62 },
    { date:"May 8",  leads:13, spend:136.89, cpl:10.53 },
    { date:"May 9",  leads:0,  spend:0,      cpl:0 },
    { date:"May 10", leads:0,  spend:0,      cpl:0 },
    { date:"May 11", leads:5,  spend:161.92, cpl:32.38 },
    { date:"May 12", leads:41, spend:422.33, cpl:10.30 },
    { date:"May 13", leads:30, spend:351.47, cpl:11.72 },
    { date:"May 14", leads:36, spend:304.37, cpl:8.45  },
    { date:"May 15", leads:27, spend:321.35, cpl:11.90 },
    { date:"May 16", leads:22, spend:194.03, cpl:8.82  },
    { date:"May 17", leads:22, spend:239.45, cpl:10.88 },
    { date:"May 18", leads:null, spend:null, cpl:null },
    { date:"May 19", leads:null, spend:null, cpl:null },
    { date:"May 20", leads:null, spend:null, cpl:null },
    { date:"May 21", leads:null, spend:null, cpl:null },
    { date:"May 22", leads:null, spend:null, cpl:null },
    { date:"May 23", leads:null, spend:null, cpl:null }
  ],
  // ADSETS — WITH vs WITHOUT PRICING (Meta all-time)
  adsets: [
    { name:"With Pricing",    spend:1543.46, leads:126, cpl:12.25, impressions:20675, reach:12200 },
    { name:"Without Pricing", spend:1850.22, leads:172, cpl:10.76, impressions:21932, reach:13200 }
  ],
  // TOP ADS BY SPEND (Meta all-time)
  ads: [
    { name:"Fasting",    spend:1747.49, leads:159, cpl:10.99, ctr:6.87 },
    { name:"Glucose",    spend:947.92,  leads:82,  cpl:11.56, ctr:7.58 },
    { name:"VO2 Max",    spend:557.69,  leads:43,  cpl:12.97, ctr:6.96 },
    { name:"Sleep",      spend:54.38,   leads:7,   cpl:7.77,  ctr:9.50 },
    { name:"Healthspan", spend:30.04,   leads:4,   cpl:7.51,  ctr:10.44 },
    { name:"Movement",   spend:31.93,   leads:1,   cpl:31.93, ctr:7.37 }
  ],
  // AGE BREAKDOWN (Meta)
  ages: [
    { age:"65+",   leads:157, cpl:11.19 },
    { age:"55–64", leads:91,  cpl:10.34 },
    { age:"45–54", leads:25,  cpl:16.21 },
    { age:"35–44", leads:13,  cpl:13.57 },
    { age:"25–34", leads:8,   cpl:10.99 },
    { age:"18–24", leads:2,   cpl:6.57  }
  ],
  // GENDER BREAKDOWN (Meta)
  genders: [
    { gender:"Female",        leads:152, cpl:10.74 },
    { gender:"Male",          leads:142, cpl:12.11 },
    { gender:"Uncategorised", leads:2,   cpl:14.50 }
  ],
  // TOP STATES (Meta)
  states: [
    { state:"Texas",        leads:69, cpl:10.25 },
    { state:"California",   leads:33, cpl:10.69 },
    { state:"New York",     leads:25, cpl:9.99  },
    { state:"Florida",      leads:19, cpl:15.18 },
    { state:"Illinois",     leads:16, cpl:8.09  },
    { state:"Ohio",         leads:15, cpl:9.17  },
    { state:"Pennsylvania", leads:14, cpl:11.38 }
  ],
  // SALES ASSUMPTIONS (user-specified for projection)
  sales: {
    contact_rate:      0.40,
    acq_rate:          0.05,
    course_price:      1350,
    actual_price:      1200,     // actual from funnel sheet
    current_week_cpl:  13.37,    // W3 final CPL
    meta_avg_cpl:      11.40,    // Meta-only avg
    acq_so_far:        8,        // W2 (4) + W3 (4)
    revenue_so_far:    9600      // W2 ($4,800) + W3 ($4,800)
  },
  // PILOT PLAN
  plan: {
    total_budget:          10000,
    pilot_days:            24,
    start:                 "May 7, 2026",
    end:                   "May 30, 2026",
    original_leads_goal:   360,
    revised_leads_goal:    675,   // updated projection from funnel sheet
    original_avg_cpl:      26,
    cpl_target:            15
  }
};
