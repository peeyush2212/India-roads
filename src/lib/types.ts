export type ModelMeta = {
  baseYear: number;
  endYear: number;
  currency: string;
};

export type IndiaBaseline = {
  co2_mt: number;
  population: number;
  gdppc_ppp: number;
  energy_intensity: number;
  renewables_share: number;
  grid_losses: number;
  forest_pct: number;
  agri_pct: number;
  pop_density: number;
  land_area_km2: number;
  clean_cooking: number;
  urban_pct: number;
  manufacturing_pct_gdp: number;
  industry_pct_gdp: number;
  rnd_pct_gdp: number;
  renew_patents: number;
  trade_pct_gdp: number;
  gcf_pct_gdp: number;
  energy_imports_pct: number;
  domestic_credit_pct_gdp: number;
  pm25_exposed_pct: number;
};

export type Betas = Record<string, number>;

export type SklearnTree = {
  children_left: number[];
  children_right: number[];
  feature: number[];
  threshold: number[];
  value: number[];
};

export type GradientBoostingModel = {
  type: "GradientBoostingRegressor";
  n_estimators: number;
  learning_rate: number;
  init: number;
  estimators: SklearnTree[];
};

export type CalibrationPack = {
  betas: Betas;
  pm_features: string[];
  pm_metrics: Record<string, number>;
  pm_model: GradientBoostingModel;
};

export type IndiaHistory = {
  year: number[];
  [k: string]: (number | null)[];
};

export type WorldInsights = {
  percentiles: Record<string, number>;
  peersLargePop: Array<Record<string, number | string>>;
};

export type ModelInputs = {
  meta: ModelMeta;
  indiaBaseline: IndiaBaseline;
  calibration: CalibrationPack;
  indiaHistory: IndiaHistory;
  worldInsights: WorldInsights;
};

export type Scenario = {
  Pop2050_billion: number;
  GDPpc_CAGR_pct: number;
  EI_improve_pct_per_year: number;
  RE2050_pct: number;
  GridLoss2050_pct: number;
  CleanCooking2050_pct: number;
  Urban2050_pct: number;
  Manuf2050_pct: number;
  RD2050_pct_gdp: number;
  RenewPatents2050_x: number;
  Trade2050_pct_gdp: number;
  GCF2050_pct_gdp: number;
  EnergyImports2050_pct: number;
  DomCredit2050_pct_gdp: number;
  Forest2050_pct: number;
  AgriLand2050_pct: number;
  AirControls_strength: number;
};

export type SimulationRow = {
  year: number;
  population: number;
  gdppc_ppp: number;
  energy_intensity: number;
  renewables_share: number;
  grid_losses: number;
  clean_cooking: number;
  urban_pct: number;
  manufacturing_pct_gdp: number;
  rnd_pct_gdp: number;
  renew_patents: number;
  trade_pct_gdp: number;
  gcf_pct_gdp: number;
  energy_imports_pct: number;
  domestic_credit_pct_gdp: number;
  forest_pct: number;
  agri_pct: number;
  emissions_mtco2: number;
  forest_sink_mtco2: number;
  net_emissions_mtco2: number;
  atm_co2_ppm_contribution: number;
  pm25_exposed_pct: number;
  co2_per_capita_t: number;
  net_co2_per_capita_t: number;
  gdp_total_ppp: number;
  co2_intensity_kg_per_$: number;
  primary_energy_MJ: number;
  primary_energy_EJ: number;
  primary_energy_per_capita_GJ: number;
  carbon_intensity_kg_per_GJ: number;
  net_carbon_intensity_kg_per_GJ: number;
  cum_emissions_gtco2: number;
  cum_net_emissions_gtco2: number;
};

export type SimulationResult = {
  rows: SimulationRow[];
  scenario: Scenario;
};
