import type { ModelInputs, Scenario, SimulationResult, SimulationRow, GradientBoostingModel, SklearnTree } from "@/lib/types";
import { clamp } from "@/lib/utils";

// --- numeric helpers ---
function smoothstep(x: number) {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
}

function rampToTarget(years: number[], startYear: number, endYear: number, startValue: number, endValue: number) {
  const denom = Math.max(1, endYear - startYear);
  return years.map((y) => {
    const t = (y - startYear) / denom;
    const w = smoothstep(t);
    return startValue + (endValue - startValue) * w;
  });
}

function expGrowth(years: number[], startYear: number, startValue: number, annualRate: number) {
  return years.map((y) => startValue * Math.pow(1 + annualRate, y - startYear));
}

function annualRateToHitTarget(startValue: number, endValue: number, nYears: number) {
  if (nYears <= 0) return 0;
  if (startValue <= 0 || endValue <= 0) return 0;
  return Math.pow(endValue / startValue, 1 / nYears) - 1;
}

function safeLogit(p: number, eps = 1e-6) {
  const pp = clamp(p, eps, 1 - eps);
  return Math.log(pp / (1 - pp));
}

function safeSigmoid(x: number) {
  // stable sigmoid
  if (x >= 0) return 1 / (1 + Math.exp(-x));
  const ex = Math.exp(x);
  return ex / (1 + ex);
}

function yearRange(startYear: number, endYear: number) {
  const years: number[] = [];
  for (let y = startYear; y <= endYear; y++) years.push(y);
  return years;
}

// --- Carbon cycle IRF ---
const A0 = 0.2173;
const A1 = 0.2240;
const A2 = 0.2824;
const A3 = 0.2763;
const TAU1 = 394.4;
const TAU2 = 36.54;
const TAU3 = 4.304;
const PPM_PER_GTCO2_ATM = 1.0 / 7.81;

function irf(dt: number) {
  return A0 + A1 * Math.exp(-dt / TAU1) + A2 * Math.exp(-dt / TAU2) + A3 * Math.exp(-dt / TAU3);
}

function emissionsToAtmosphericPpm(netEmissionsMt: number[], years: number[]) {
  // Convolution, O(n^2) but n~30
  const n = netEmissionsMt.length;
  const atmGt = new Array(n).fill(0);
  const Egt = netEmissionsMt.map((mt) => mt / 1000.0);

  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      const dt = years[j] - years[i];
      atmGt[j] += Egt[i] * irf(dt);
    }
  }
  return atmGt.map((gt) => gt * PPM_PER_GTCO2_ATM);
}

// --- PM2.5 model inference (exported scikit-learn GradientBoostingRegressor) ---
function predictTree(tree: SklearnTree, row: number[]) {
  let node = 0;
  while (true) {
    const left = tree.children_left[node];
    const right = tree.children_right[node];
    if (left === -1 && right === -1) {
      return tree.value[node];
    }
    const feat = tree.feature[node];
    const thr = tree.threshold[node];
    const x = row[feat];
    node = x <= thr ? left : right;
    if (node < 0) {
      // safety fallback
      return tree.value[Math.max(0, Math.min(tree.value.length - 1, node))] ?? tree.value[0];
    }
  }
}

function gbrPredict(model: GradientBoostingModel, X: number[][]) {
  const out: number[] = [];
  for (const row of X) {
    let s = 0;
    for (const tree of model.estimators) {
      s += predictTree(tree, row);
    }
    out.push(model.init + model.learning_rate * s);
  }
  return out;
}

// --- Default scenario (mirrors Python logic) ---
function estimateRecentCagr(history: { year: number[]; [k: string]: (number | null)[] }, key: string, baseYear: number, lookbackYears = 10) {
  const years = history.year;
  const vals = history[key] as (number | null)[];
  const pairs = years
    .map((y, i) => ({ y, v: vals[i] }))
    .filter((p) => p.v !== null && isFinite(p.v as number) && p.y <= baseYear) as { y: number; v: number }[];
  if (pairs.length < 2) return 0;

  const y1 = baseYear;
  const y0 = Math.max(pairs[0].y, y1 - lookbackYears);

  const v1Exact = pairs.find((p) => p.y === y1)?.v;
  const v0Exact = pairs.find((p) => p.y === y0)?.v;

  let v0: number;
  let v1: number;
  let yy0: number;
  let yy1: number;

  if (v1Exact !== undefined && v0Exact !== undefined) {
    v0 = v0Exact;
    v1 = v1Exact;
    yy0 = y0;
    yy1 = y1;
  } else {
    const sub = pairs.filter((p) => p.y >= y0 && p.y <= y1).sort((a, b) => a.y - b.y);
    if (sub.length < 2) return 0;
    v0 = sub[0].v;
    v1 = sub[sub.length - 1].v;
    yy0 = sub[0].y;
    yy1 = sub[sub.length - 1].y;
  }

  const n = Math.max(1, yy1 - yy0);
  if (v0 <= 0 || v1 <= 0) return 0;
  return Math.pow(v1 / v0, 1 / n) - 1;
}

export function defaultScenario(inputs: ModelInputs): Scenario {
  const b = inputs.indiaBaseline;
  const baseYear = inputs.meta.baseYear;
  const endYear = inputs.meta.endYear;
  const years = endYear - baseYear;

  // Population: declining growth toward ~0 by 2050
  const popCagr = estimateRecentCagr(inputs.indiaHistory, "population", baseYear, 10);
  const avgR = 0.5 * popCagr;
  const pop2050 = b.population * Math.pow(1 + avgR, years);
  const pop2050B = pop2050 / 1e9;

  // GDPpc CAGR
  const gdpCagr = estimateRecentCagr(inputs.indiaHistory, "gdppc_ppp", baseYear, 10) * 100;

  // EI improvement
  const eiCagr = estimateRecentCagr(inputs.indiaHistory, "energy_intensity", baseYear, 10);
  const eiImprove = Math.max(0, -eiCagr) * 100;

  // RE share +10pp
  const re2050 = clamp(b.renewables_share + 10, 0, 95);

  // Grid losses improve to 60% of current, cap
  const loss2050 = clamp(b.grid_losses * 0.6, 3, 30);

  // Clean cooking
  const cook2050 = clamp(Math.max(b.clean_cooking, 70) + 20, 50, 99);

  // Urbanization
  const urb2050 = clamp(b.urban_pct + 20, 20, 90);

  // Manufacturing
  const man2050 = clamp(b.manufacturing_pct_gdp + 2, 5, 35);

  // R&D
  const rd0 = isFinite(b.rnd_pct_gdp) ? b.rnd_pct_gdp : 0.7;
  const rd2050 = clamp(rd0 + 0.5, 0.1, 4.0);

  // Patents double
  const patX = 2.0;

  // Trade/invest/import/credit keep similar
  const trade2050 = clamp(b.trade_pct_gdp ?? 45, 10, 150);
  const gcf2050 = clamp(b.gcf_pct_gdp ?? 30, 10, 60);
  const imp2050 = clamp(b.energy_imports_pct ?? 35, -30, 80);
  const cred2050 = clamp(b.domestic_credit_pct_gdp ?? 50, 5, 250);

  const forest2050 = clamp(b.forest_pct + 2, 5, 60);
  const agri2050 = clamp(b.agri_pct, 20, 80);

  return {
    Pop2050_billion: Number(pop2050B.toFixed(2)),
    GDPpc_CAGR_pct: Number(gdpCagr.toFixed(1)),
    EI_improve_pct_per_year: Number(eiImprove.toFixed(1)),
    RE2050_pct: Number(re2050.toFixed(0)),
    GridLoss2050_pct: Number(loss2050.toFixed(1)),
    CleanCooking2050_pct: Number(cook2050.toFixed(0)),
    Urban2050_pct: Number(urb2050.toFixed(0)),
    Manuf2050_pct: Number(man2050.toFixed(1)),
    RD2050_pct_gdp: Number(rd2050.toFixed(2)),
    RenewPatents2050_x: patX,
    Trade2050_pct_gdp: Number(trade2050.toFixed(0)),
    GCF2050_pct_gdp: Number(gcf2050.toFixed(0)),
    EnergyImports2050_pct: Number(imp2050.toFixed(0)),
    DomCredit2050_pct_gdp: Number(cred2050.toFixed(0)),
    Forest2050_pct: Number(forest2050.toFixed(1)),
    AgriLand2050_pct: Number(agri2050.toFixed(1)),
    AirControls_strength: 0.15,
  };
}

export function simulate(inputs: ModelInputs, scenario: Scenario, opts?: { gridLossWeight?: number; forestSeq_tco2_per_ha_yr?: number }):
  SimulationResult {
  const b = inputs.indiaBaseline;
  const betas = inputs.calibration.betas;

  const baseYear = inputs.meta.baseYear;
  const endYear = inputs.meta.endYear;
  const years = yearRange(baseYear, endYear);

  const gridLossWeight = opts?.gridLossWeight ?? 0.25;
  const forestSeq = opts?.forestSeq_tco2_per_ha_yr ?? 3.0;

  // ---- Exogenous trajectories ----
  const pop0 = b.population;
  const pop2050 = scenario.Pop2050_billion * 1e9;
  const popR = annualRateToHitTarget(pop0, pop2050, endYear - baseYear);
  const pop = expGrowth(years, baseYear, pop0, popR);

  const gdppc0 = b.gdppc_ppp;
  const g = scenario.GDPpc_CAGR_pct / 100;
  const gdppc = expGrowth(years, baseYear, gdppc0, g);

  const cook0 = isFinite(b.clean_cooking) ? b.clean_cooking : 70;
  const cook = rampToTarget(years, baseYear, endYear, cook0, scenario.CleanCooking2050_pct);

  const urb0 = isFinite(b.urban_pct) ? b.urban_pct : 35;
  const urban = rampToTarget(years, baseYear, endYear, urb0, scenario.Urban2050_pct);

  const man0 = isFinite(b.manufacturing_pct_gdp) ? b.manufacturing_pct_gdp : 14;
  const manuf = rampToTarget(years, baseYear, endYear, man0, scenario.Manuf2050_pct);

  const rd0 = isFinite(b.rnd_pct_gdp) ? b.rnd_pct_gdp : 0.65;
  const rnd = rampToTarget(years, baseYear, endYear, rd0, scenario.RD2050_pct_gdp);

  const trade0 = isFinite(b.trade_pct_gdp) ? b.trade_pct_gdp : 45;
  const trade = rampToTarget(years, baseYear, endYear, trade0, scenario.Trade2050_pct_gdp);

  const gcf0 = isFinite(b.gcf_pct_gdp) ? b.gcf_pct_gdp : 32;
  const gcf = rampToTarget(years, baseYear, endYear, gcf0, scenario.GCF2050_pct_gdp);

  const imp0 = isFinite(b.energy_imports_pct) ? b.energy_imports_pct : 35;
  const eimports = rampToTarget(years, baseYear, endYear, imp0, scenario.EnergyImports2050_pct);

  const cred0 = isFinite(b.domestic_credit_pct_gdp) ? b.domestic_credit_pct_gdp : 50;
  const credit = rampToTarget(years, baseYear, endYear, cred0, scenario.DomCredit2050_pct_gdp);

  const pat0 = isFinite(b.renew_patents) && b.renew_patents > 0 ? b.renew_patents : 500;
  const pat2050 = pat0 * Math.max(0.1, scenario.RenewPatents2050_x);
  const patents = rampToTarget(years, baseYear, endYear, pat0, pat2050);

  const loss0 = isFinite(b.grid_losses) ? b.grid_losses : 15;
  let losses = rampToTarget(years, baseYear, endYear, loss0, scenario.GridLoss2050_pct);
  losses = losses.map((x) => clamp(x, 0.1, 40));

  // Land
  const forest0 = isFinite(b.forest_pct) ? b.forest_pct : 24;
  const agri0 = isFinite(b.agri_pct) ? b.agri_pct : 60;

  let forestTgt = scenario.Forest2050_pct;
  const agriTgt = scenario.AgriLand2050_pct;
  // soft land constraint: forest + agri <= 95
  if (forestTgt + agriTgt > 95) {
    forestTgt = Math.max(0, 95 - agriTgt);
  }
  const forest = rampToTarget(years, baseYear, endYear, forest0, forestTgt);
  const agri = rampToTarget(years, baseYear, endYear, agri0, agriTgt);

  // Renewables share core
  const re0 = isFinite(b.renewables_share) ? b.renewables_share : 30;
  let reCore = rampToTarget(years, baseYear, endYear, re0, scenario.RE2050_pct);
  reCore = reCore.map((x) => clamp(x, 0.1, 99));

  // Enabling adjustments in logit space
  const logitCore = reCore.map((x) => safeLogit(x / 100));

  function beta(name: string, dflt: number) {
    const v = betas[name];
    return typeof v === "number" && isFinite(v) ? v : dflt;
  }

  const adj = years.map((_, i) => {
    const drd = rnd[i] - rnd[0];
    const dtrade = trade[i] - trade[0];
    const dimp = eimports[i] - eimports[0];
    const dpat = patents[i] - patents[0];
    const dcred = credit[i] - credit[0];
    const dcook = cook[i] - cook[0];
    const durb = urban[i] - urban[0];

    let a = 0;
    a += beta("beta_logitRE_Research and development expenditure (% of GDP)", 0.12) * drd;
    a += beta("beta_logitRE_Trade (% of GDP)", 0.004) * dtrade;
    a += beta("beta_logitRE_Energy imports, net (% of energy use)", 0.001) * dimp;
    a += beta("beta_logitRE_total renewable patents", 0.00002) * dpat;
    a += beta("beta_logitRE_Domestic credit to private sector (% of GDP)", 0.0) * dcred;
    a += beta("beta_logitRE_Access to clean fuels and technologies for cooking (% of population)", -0.02) * dcook;
    a += beta("beta_logitRE_Urban population (% of total population)", -0.004) * durb;

    return clamp(a, -2, 2);
  });

  let reAdj = years.map((_, i) => safeSigmoid(logitCore[i] + adj[i]) * 100);
  reAdj = reAdj.map((x) => clamp(x, 0.1, 99));

  // Energy intensity
  const ei0 = isFinite(b.energy_intensity) && b.energy_intensity > 0 ? b.energy_intensity : 4;
  const eff = clamp(scenario.EI_improve_pct_per_year / 100, 0, 0.08);
  const dt = years.map((y) => y - baseYear);
  const eiBase = dt.map((d) => ei0 * Math.pow(1 - eff, d));

  let logEi = eiBase.map((x) => Math.log(Math.max(1e-9, x)));

  function gamma(name: string, dflt: number) {
    const v = betas[name];
    return typeof v === "number" && isFinite(v) ? v : dflt;
  }

  logEi = logEi.map((le, i) => {
    const dman = manuf[i] - manuf[0];
    const durb = urban[i] - urban[0];
    const drd = rnd[i] - rnd[0];
    const dtrade = trade[i] - trade[0];
    const dgcf = gcf[i] - gcf[0];
    const dcook = cook[i] - cook[0];
    const dcred = credit[i] - credit[0];

    let v = le;
    v += gamma("gamma_EI_Manufacturing, value added (% of GDP)_pp", 0.008) * dman;
    v += gamma("gamma_EI_Urban population (% of total population)_pp", 0.004) * durb;
    v += gamma("gamma_EI_Research and development expenditure (% of GDP)_pp", -0.002) * drd;
    v += gamma("gamma_EI_Trade (% of GDP)_pp", -0.001) * dtrade;
    v += gamma("gamma_EI_Gross capital formation (% of GDP)_pp", 0.001) * dgcf;
    v += gamma("gamma_EI_Access to clean fuels and technologies for cooking (% of population)_pp", -0.001) * dcook;
    v += gamma("gamma_EI_Domestic credit to private sector (% of GDP)_pp", 0.0) * dcred;

    // clamp to ±60% deviation
    const lo = Math.log(Math.max(1e-9, eiBase[i])) - 0.6;
    const hi = Math.log(Math.max(1e-9, eiBase[i])) + 0.6;
    return clamp(v, lo, hi);
  });

  const eiAdj = logEi.map((le) => Math.exp(le));

  // Grid losses factor on part of EI
  const lossFrac0 = clamp(losses[0] / 100, 0, 0.5);
  const lossFrac = losses.map((x) => clamp(x / 100, 0, 0.5));
  const gridFactor = lossFrac.map((lf) => {
    const denom = 1 - lf;
    const denom0 = 1 - lossFrac0;
    if (denom <= 0 || denom0 <= 0) return 1;
    return Math.pow(denom0 / denom, gridLossWeight);
  });

  const eiEff = eiAdj.map((x, i) => x * gridFactor[i]);

  // Carbon intensity
  const CI0 = b.co2_mt / (b.population * b.gdppc_ppp * b.energy_intensity);
  const betaRe = beta("beta_CI_RE_pp", -0.015);
  const betaCook = beta("beta_CI_CLEANCOOK_pp", 0.003);

  const logCI0 = Math.log(CI0);
  let logCIt = years.map((_, i) => logCI0 + betaRe * (reAdj[i] - reAdj[0]) + betaCook * (cook[i] - cook[0]));
  const loCI = Math.log(CI0 * 0.2);
  const hiCI = Math.log(CI0 * 3.0);
  logCIt = logCIt.map((x) => clamp(x, loCI, hiCI));
  const CI = logCIt.map((x) => Math.exp(x));

  // Emissions
  const E0 = b.co2_mt;
  const emissions = years.map((_, i) =>
    E0 * (pop[i] / pop0) * (gdppc[i] / gdppc0) * (eiEff[i] / ei0) * (CI[i] / CI0)
  );

  // Forest sink
  const landKm2 = b.land_area_km2;
  const forestKm2 = forest.map((f) => (f / 100) * landKm2);
  const forest0Km2 = forestKm2[0];
  const sinkMt = forestKm2.map((fk) => {
    const deltaKm2 = fk - forest0Km2;
    // tCO2/ha/yr -> MtCO2/yr; 1 km2 = 100 ha
    return (deltaKm2 * 100 * forestSeq) / 1e6;
  });

  const netEmissions = emissions.map((e, i) => e - sinkMt[i]);

  // Atmospheric ppm contribution
  const atmPpm = emissionsToAtmosphericPpm(netEmissions, years);

  // PM2.5
  const pm25: number[] = new Array(years.length).fill(NaN);
  const pmModel = inputs.calibration.pm_model;
  const pmFeatures = inputs.calibration.pm_features;
  if (pmModel && pmFeatures && pmFeatures.length > 0) {
    const X: number[][] = [];
    for (let i = 0; i < years.length; i++) {
      const co2Pc = (emissions[i] * 1e6) / pop[i];
      const featMap: Record<string, number> = {
        log_gdppc: Math.log(Math.max(1e-6, gdppc[i])),
        log_co2_pc: Math.log(Math.max(1e-6, co2Pc)),
        "Access to clean fuels and technologies for cooking (% of population)": cook[i],
        "Urban population (% of total population)": urban[i],
        "Renewable energy consumption (% of total final energy consumption)_x": reAdj[i],
      };
      X.push(pmFeatures.map((f) => featMap[f] ?? 0));
    }

    const pred = gbrPredict(pmModel, X).map((v) => clamp(v, 0, 1));
    const strength = clamp(scenario.AirControls_strength, 0, 0.9);
    for (let i = 0; i < years.length; i++) {
      pm25[i] = pred[i] * (1 - strength) * 100;
    }
  }

  // Derived indicators + assemble
  const rows: SimulationRow[] = [];
  let cumGross = 0;
  let cumNet = 0;

  for (let i = 0; i < years.length; i++) {
    const gdpTotal = pop[i] * gdppc[i];
    const primaryEnergyMJ = eiEff[i] * gdpTotal;
    const primaryEnergyEJ = primaryEnergyMJ / 1e12;

    const co2Pc = (emissions[i] * 1e6) / pop[i];
    const netCo2Pc = (netEmissions[i] * 1e6) / pop[i];

    const co2Intensity = (emissions[i] * 1e9) / gdpTotal; // kg/$

    const pePcGJ = (primaryEnergyMJ / pop[i]) / 1000;

    const carbonIntensity = (emissions[i] * 1e12) / primaryEnergyMJ; // kg/GJ
    const netCarbonIntensity = (netEmissions[i] * 1e12) / primaryEnergyMJ;

    cumGross += emissions[i] / 1000;
    cumNet += netEmissions[i] / 1000;

    rows.push({
      year: years[i],
      population: pop[i],
      gdppc_ppp: gdppc[i],
      energy_intensity: eiEff[i],
      renewables_share: reAdj[i],
      grid_losses: losses[i],
      clean_cooking: cook[i],
      urban_pct: urban[i],
      manufacturing_pct_gdp: manuf[i],
      rnd_pct_gdp: rnd[i],
      renew_patents: patents[i],
      trade_pct_gdp: trade[i],
      gcf_pct_gdp: gcf[i],
      energy_imports_pct: eimports[i],
      domestic_credit_pct_gdp: credit[i],
      forest_pct: forest[i],
      agri_pct: agri[i],
      emissions_mtco2: emissions[i],
      forest_sink_mtco2: sinkMt[i],
      net_emissions_mtco2: netEmissions[i],
      atm_co2_ppm_contribution: atmPpm[i],
      pm25_exposed_pct: pm25[i],
      co2_per_capita_t: co2Pc,
      net_co2_per_capita_t: netCo2Pc,
      gdp_total_ppp: gdpTotal,
      co2_intensity_kg_per_$: co2Intensity,
      primary_energy_MJ: primaryEnergyMJ,
      primary_energy_EJ: primaryEnergyEJ,
      primary_energy_per_capita_GJ: pePcGJ,
      carbon_intensity_kg_per_GJ: carbonIntensity,
      net_carbon_intensity_kg_per_GJ: netCarbonIntensity,
      cum_emissions_gtco2: cumGross,
      cum_net_emissions_gtco2: cumNet,
    });
  }

  return { rows, scenario };
}

export function toCsv(rows: SimulationRow[]) {
  const cols = Object.keys(rows[0] ?? {});
  const header = cols.join(",");
  const lines = rows.map((r) => cols.map((c) => {
    const v = (r as any)[c];
    if (v === null || v === undefined || Number.isNaN(v)) return "";
    return typeof v === "number" ? String(v) : JSON.stringify(v);
  }).join(","));
  return [header, ...lines].join("\n");
}

export function summarize2050(res: SimulationResult) {
  const r2050 = res.rows[res.rows.length - 1];
  const base = res.rows[0];
  return {
    year: r2050.year,
    emissions2050: r2050.emissions_mtco2,
    netEmissions2050: r2050.net_emissions_mtco2,
    cumNetGt: r2050.cum_net_emissions_gtco2,
    ppmContribution2050: r2050.atm_co2_ppm_contribution,
    renewables2050: r2050.renewables_share,
    ei2050: r2050.energy_intensity,
    pm25_2050: r2050.pm25_exposed_pct,
    co2pc_2050: r2050.co2_per_capita_t,
    baselineYear: base.year,
  };
}

export function makeWaterfallContributions(baseline: SimulationResult, current: SimulationResult) {
  // Build a simple multiplicative driver waterfall for 2050 net emissions.
  const b0 = baseline.rows[0];
  const b2050 = baseline.rows[baseline.rows.length - 1];
  const c0 = current.rows[0];
  const c2050 = current.rows[current.rows.length - 1];

  // gross = pop*gdppc*ei*ci * (E0 identity)
  // Here we use emissions_mtco2 as gross; sink treated separately.
  const baseGross = b2050.emissions_mtco2;
  const curGross = c2050.emissions_mtco2;
  const deltaGross = curGross - baseGross;

  const factors = {
    Population: c2050.population / b2050.population,
    "GDP per capita": c2050.gdppc_ppp / b2050.gdppc_ppp,
    "Energy intensity": c2050.energy_intensity / b2050.energy_intensity,
    "Carbon intensity": c2050.carbon_intensity_kg_per_GJ / b2050.carbon_intensity_kg_per_GJ,
  };

  const logRatios = Object.fromEntries(
    Object.entries(factors).map(([k, v]) => [k, Math.log(Math.max(1e-9, v))])
  ) as Record<string, number>;

  const totalLog = Object.values(logRatios).reduce((a, b) => a + b, 0);

  const contrib: { name: string; value: number }[] = [];
  if (Math.abs(totalLog) < 1e-9) {
    for (const k of Object.keys(logRatios)) contrib.push({ name: k, value: 0 });
  } else {
    for (const [k, lr] of Object.entries(logRatios)) {
      contrib.push({ name: k, value: deltaGross * (lr / totalLog) });
    }
  }

  // Sink contribution in net terms
  const deltaSink = c2050.forest_sink_mtco2 - b2050.forest_sink_mtco2;
  contrib.push({ name: "Forest sink", value: -deltaSink });

  const baseNet = b2050.net_emissions_mtco2;
  const curNet = c2050.net_emissions_mtco2;
  const deltaNet = curNet - baseNet;

  return {
    baselineNet: baseNet,
    currentNet: curNet,
    deltaNet,
    contrib,
  };
}

export function randomScenarioAround(s: Scenario, spread = 0.15): Scenario {
  // spread ~ fraction of (range) is applied in a normal-ish way; this is a UI explorer tool, not a probabilistic model.
  function jitter(x: number, rel = spread) {
    const r = (Math.random() * 2 - 1) * rel;
    return x * (1 + r);
  }
  // Keep within plausible bounds (same as slider bounds)
  return {
    Pop2050_billion: clamp(jitter(s.Pop2050_billion), 1.1, 1.8),
    GDPpc_CAGR_pct: clamp(jitter(s.GDPpc_CAGR_pct), 1.0, 7.5),
    EI_improve_pct_per_year: clamp(jitter(s.EI_improve_pct_per_year), 0.0, 6.0),
    RE2050_pct: clamp(jitter(s.RE2050_pct), 5.0, 95.0),
    GridLoss2050_pct: clamp(jitter(s.GridLoss2050_pct), 3.0, 25.0),
    CleanCooking2050_pct: clamp(jitter(s.CleanCooking2050_pct), 40.0, 99.0),
    Urban2050_pct: clamp(jitter(s.Urban2050_pct), 25.0, 90.0),
    Manuf2050_pct: clamp(jitter(s.Manuf2050_pct), 5.0, 35.0),
    RD2050_pct_gdp: clamp(jitter(s.RD2050_pct_gdp), 0.1, 4.0),
    RenewPatents2050_x: clamp(jitter(s.RenewPatents2050_x), 0.5, 10.0),
    Trade2050_pct_gdp: clamp(jitter(s.Trade2050_pct_gdp), 10.0, 150.0),
    GCF2050_pct_gdp: clamp(jitter(s.GCF2050_pct_gdp), 10.0, 60.0),
    EnergyImports2050_pct: clamp(jitter(s.EnergyImports2050_pct), -30.0, 80.0),
    DomCredit2050_pct_gdp: clamp(jitter(s.DomCredit2050_pct_gdp), 10.0, 250.0),
    Forest2050_pct: clamp(jitter(s.Forest2050_pct), 5.0, 60.0),
    AgriLand2050_pct: clamp(jitter(s.AgriLand2050_pct), 20.0, 80.0),
    AirControls_strength: clamp(jitter(s.AirControls_strength), 0.0, 0.8),
  };
}
