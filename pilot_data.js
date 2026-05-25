var PILOT = {
  // META ALL-TIME (May 7 – 22, 2026)
  meta_total: {
    spend: 3370.99, leads: 296, cpl: 11.40,
    impressions: 42356, reach: 22392, cpm: 150.79, cpc: 1.12, ctr: 7.10, clicks: 3010, lpv: 1413
  },
  // GOOGLE (May 7 – 17, last data)
  google_total: { spend: 1871.20, leads: 8, cpl: 233.90 },
  // COMBINED
  combined: { spend: 5242.19, leads: 304, cpl: 17.24 },
  // WEEKLY (Meta + Google)
  weeks: [
    { week:1, dates:"May 7–11",  budget:2400, cpl_plan:44,  leads_plan:55,  spend:1085.43, leads:21,  cpl:51.69, acq:0,  revenue:0,    mroi:0    },
    { week:2, dates:"May 12–17", budget:4000, cpl_plan:36,  leads_plan:142, spend:2970.00, leads:184, cpl:16.14, acq:4,  revenue:4800, mroi:1.62 },
    { week:3, dates:"May 18–22", budget:3000, cpl_plan:24,  leads_plan:150, spend:1186.56, leads:99,  cpl:11.98, acq:null,revenue:null, mroi:null }
  ],
  // DAILY META DATA (May 7 – 22)
  meta_days: [
    { date:"May 7",  leads:1,  spend:52.62,  cpl:52.62 },
    { date:"May 8",  leads:13, spend:136.89, cpl:10.53 },
    { date:"May 9",  leads:0,  spend:0,      cpl:0 },
    { date:"May 10", leads:0,  spend:0,      cpl:0 },
    { date:"May 11", leads:5,  spend:161.92, cpl:32.38 },
    { date:"May 12", leads:41, spend:422.33, cpl:10.30 },
    { date:"May 13", leads:30, spend:351.47, cpl:11.72 },
    { date:"May 14", leads:36, spend:304.37, cpl:8.45 },
    { date:"May 15", leads:27, spend:321.35, cpl:11.90 },
    { date:"May 16", leads:22, spend:194.03, cpl:8.82 },
    { date:"May 17", leads:22, spend:239.45, cpl:10.88 },
    { date:"May 18", leads:null,spend:null, cpl:null },
    { date:"May 19", leads:null,spend:null, cpl:null },
    { date:"May 20", leads:null,spend:null, cpl:null },
    { date:"May 21", leads:null,spend:null, cpl:null },
    { date:"May 22", leads:null,spend:null, cpl:null }
  ],
  // ADSETS — WITH vs WITHOUT PRICING
  adsets: [
    { name:"With Pricing", id:"Adset 1", spend:1543.46, leads:126, cpl:12.25, impressions:20675, cpc:2.10, ctr:3.56, reach:12200 },
    { name:"Without Pricing", id:"Adset 2", spend:1850.22, leads:172, cpl:10.76, impressions:21932, cpc:2.73, ctr:3.10, reach:13200 }
  ],
  // TOP ADS BY SPEND
  ads: [
    { name:"Fasting",   adset:"No Pricing",   spend:1747.49, leads:159, cpl:10.99, impr:21027, reach:11828, ctr:6.87, cpc:1.21 },
    { name:"Glucose",   adset:"With Pricing", spend:947.92,  leads:82,  cpl:11.56, impr:9080,  reach:5817,  ctr:7.58, cpc:1.38 },
    { name:"VO2 Max",   adset:"With Pricing", spend:557.69,  leads:43,  cpl:12.97, impr:11213, reach:6814,  ctr:6.96, cpc:0.71 },
    { name:"Sleep",     adset:"No Pricing",   spend:54.38,   leads:7,   cpl:7.77,  impr:420,   reach:324,   ctr:9.50, cpc:1.36 },
    { name:"Healthspan",adset:"No Pricing",   spend:30.04,   leads:4,   cpl:7.51,  impr:294,   reach:234,   ctr:10.44,cpc:0.98 },
    { name:"Movement",  adset:"With Pricing", spend:31.93,   leads:1,   cpl:31.93, impr:312,   reach:252,   ctr:7.37, cpc:1.39 }
  ],
  // AGE BREAKDOWN
  ages: [
    { age:"65+",   leads:157, cpl:11.19, spend:1751.30, impr:19316 },
    { age:"55–64", leads:91,  cpl:10.34, spend:939.21,  impr:12849 },
    { age:"45–54", leads:25,  cpl:16.21, spend:404.80,  impr:6026 },
    { age:"35–44", leads:13,  cpl:13.57, spend:176.36,  impr:2546 },
    { age:"25–34", leads:8,   cpl:10.99, spend:87.80,   impr:1363 },
    { age:"18–24", leads:2,   cpl:6.57,  spend:13.14,   impr:269 }
  ],
  // GENDER BREAKDOWN
  genders: [
    { gender:"Female",       leads:152, cpl:10.74, spend:1627.30, impr:17875 },
    { gender:"Male",         leads:142, cpl:12.11, spend:1716.39, impr:24160 },
    { gender:"Uncategorised",leads:2,   cpl:14.50, spend:28.92,   impr:334 }
  ],
  // TOP STATES
  states: [
    { state:"Texas",       leads:69, cpl:10.25, spend:707.39 },
    { state:"California",  leads:33, cpl:10.69, spend:352.87 },
    { state:"New York",    leads:25, cpl:9.99,  spend:249.68 },
    { state:"Florida",     leads:19, cpl:15.18, spend:288.40 },
    { state:"Illinois",    leads:16, cpl:8.09,  spend:129.39 },
    { state:"Ohio",        leads:15, cpl:9.17,  spend:137.59 },
    { state:"Pennsylvania",leads:14, cpl:11.38, spend:159.35 }
  ],
  // SALES ASSUMPTIONS
  sales: {
    contact_rate: 0.40,
    acq_rate:     0.05,
    course_price: 1350,
    current_week_cpl: 11.98,
    pilot_avg_cpl:    11.40,
    acq_so_far:       4,
    revenue_so_far:   4800
  },
  // PILOT PLAN
  plan: {
    total_budget: 10000,
    pilot_days:   21,
    start:        "May 7, 2026",
    end:          "May 27, 2026",
    original_leads_goal: 360,
    revised_leads_goal:  550,
    original_avg_cpl:    26,
    week3_cpl_target:    15
  }
};
