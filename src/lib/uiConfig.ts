import type { Scenario } from "@/lib/types";

export type LeverKey = keyof Scenario;

export type LeverSpec = {
  key: LeverKey;
  title: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  group:
    | "Economy & People"
    | "Energy & Power"
    | "Structure & Society"
    | "Innovation & Finance"
    | "Energy Security"
    | "Land & Sinks"
    | "Health Co‑benefits";
  help: string;
};

export const leverSpecs: LeverSpec[] = [
  {
    key: "Pop2050_billion",
    title: "Population in 2050",
    unit: "B people",
    min: 1.1,
    max: 1.8,
    step: 0.01,
    group: "Economy & People",
    help: "Population trajectory. Affects demand via the Kaya identity.",
  },
  {
    key: "GDPpc_CAGR_pct",
    title: "GDP per capita growth (2021→2050)",
    unit: "%/yr",
    min: 1.0,
    max: 7.5,
    step: 0.1,
    group: "Economy & People",
    help: "Average GDP per capita growth rate. Strong driver of demand.",
  },
  {
    key: "EI_improve_pct_per_year",
    title: "Energy efficiency improvement",
    unit: "%/yr",
    min: 0.0,
    max: 6.0,
    step: 0.1,
    group: "Energy & Power",
    help: "Energy intensity decline rate (MJ per $ GDP). Higher = faster efficiency gains.",
  },
  {
    key: "RE2050_pct",
    title: "Renewable energy share in 2050 (proxy)",
    unit: "%",
    min: 5.0,
    max: 95.0,
    step: 1.0,
    group: "Energy & Power",
    help: "Renewable energy consumption proxy (% of total final energy). Includes traditional biomass.",
  },
  {
    key: "GridLoss2050_pct",
    title: "Grid T&D losses in 2050",
    unit: "%",
    min: 3.0,
    max: 25.0,
    step: 0.2,
    group: "Energy & Power",
    help: "Lower losses reduce generation required for the same delivered electricity.",
  },
  {
    key: "Manuf2050_pct",
    title: "Manufacturing share of GDP in 2050",
    unit: "%",
    min: 5.0,
    max: 35.0,
    step: 0.5,
    group: "Structure & Society",
    help: "Higher manufacturing tends to increase energy intensity (more energy-intensive output).",
  },
  {
    key: "Urban2050_pct",
    title: "Urban population share in 2050",
    unit: "%",
    min: 25.0,
    max: 90.0,
    step: 1.0,
    group: "Structure & Society",
    help: "Urbanization changes demand patterns; the model uses data-estimated elasticities.",
  },
  {
    key: "CleanCooking2050_pct",
    title: "Access to clean cooking in 2050",
    unit: "%",
    min: 40.0,
    max: 99.0,
    step: 1.0,
    group: "Structure & Society",
    help: "Large health co-benefit. In fossil-only CO₂ accounting, switching from biomass to LPG/electric can increase measured CO₂ slightly.",
  },
  {
    key: "RD2050_pct_gdp",
    title: "R&D spending in 2050",
    unit: "% of GDP",
    min: 0.1,
    max: 4.0,
    step: 0.05,
    group: "Innovation & Finance",
    help: "Higher R&D accelerates renewables and improves efficiency (panel-calibrated).",
  },
  {
    key: "RenewPatents2050_x",
    title: "Renewable innovation (patents) by 2050",
    unit: "× baseline",
    min: 0.5,
    max: 10.0,
    step: 0.1,
    group: "Innovation & Finance",
    help: "Proxy for clean-tech innovation capacity; increases renewables adoption.",
  },
  {
    key: "DomCredit2050_pct_gdp",
    title: "Domestic credit to private sector in 2050",
    unit: "% of GDP",
    min: 10.0,
    max: 250.0,
    step: 5.0,
    group: "Innovation & Finance",
    help: "Finance depth proxy; small data-driven effect.",
  },
  {
    key: "GCF2050_pct_gdp",
    title: "Investment rate (gross capital formation) in 2050",
    unit: "% of GDP",
    min: 10.0,
    max: 60.0,
    step: 1.0,
    group: "Innovation & Finance",
    help: "Investment can raise activity; can also enable cleaner tech. Elasticities kept conservative.",
  },
  {
    key: "Trade2050_pct_gdp",
    title: "Trade openness in 2050",
    unit: "% of GDP",
    min: 10.0,
    max: 150.0,
    step: 2.0,
    group: "Innovation & Finance",
    help: "Trade can diffuse technology and shift structure; small panel-based effects.",
  },
  {
    key: "EnergyImports2050_pct",
    title: "Net energy imports in 2050",
    unit: "% of energy use",
    min: -30.0,
    max: 80.0,
    step: 2.0,
    group: "Energy Security",
    help: "Higher imports can motivate domestic renewables in the model (small effect).",
  },
  {
    key: "Forest2050_pct",
    title: "Forest area in 2050",
    unit: "% of land",
    min: 5.0,
    max: 60.0,
    step: 0.5,
    group: "Land & Sinks",
    help: "Forest expansion adds a CO₂ sink (MtCO₂/yr) using a conservative sequestration rate.",
  },
  {
    key: "AgriLand2050_pct",
    title: "Agricultural land in 2050",
    unit: "% of land",
    min: 20.0,
    max: 80.0,
    step: 0.5,
    group: "Land & Sinks",
    help: "Soft land constraint: forest + agricultural land capped (proxy for competing land uses).",
  },
  {
    key: "AirControls_strength",
    title: "Air pollution controls strength",
    unit: "(PM reduction)",
    min: 0.0,
    max: 0.8,
    step: 0.05,
    group: "Health Co‑benefits",
    help: "Reduces PM2.5 exposure output without directly changing CO₂ (end-of-pipe controls proxy).",
  },
];

export const leverGroups = Array.from(new Set(leverSpecs.map((l) => l.group)));
