"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIndiaRoadsStore } from "@/lib/store";
import { randomScenarioAround, simulate, summarize2050 } from "@/lib/simulator";
import { EChart } from "@/components/charts/EChart";
import type { Scenario } from "@/lib/types";
import { leverSpecs } from "@/lib/uiConfig";

type MetricKey =
  | "netEmissions2050"
  | "cumNetGt"
  | "ppmContribution2050"
  | "renewables2050"
  | "ei2050"
  | "pm25_2050"
  | "co2pc_2050";

const metricLabels: Record<MetricKey, string> = {
  netEmissions2050: "2050 Net CO₂ (Mt/yr)",
  cumNetGt: "Cumulative Net CO₂ (Gt)",
  ppmContribution2050: "Atm. CO₂ contribution (ppm)",
  renewables2050: "Renewables (2050, %)",
  ei2050: "Energy intensity (2050)",
  pm25_2050: "PM2.5 exposed (2050, %)",
  co2pc_2050: "CO₂ per capita (2050, t)",
};

function metricValue(summary: ReturnType<typeof summarize2050>, key: MetricKey) {
  return (summary as any)[key] as number;
}

export function Explorer() {
  const inputs = useIndiaRoadsStore((s) => s.inputs);
  const scenario = useIndiaRoadsStore((s) => s.scenario);
  const setScenario = useIndiaRoadsStore((s) => s.setScenario);
  const baselineSim = useIndiaRoadsStore((s) => s.baselineSim);
  const sim = useIndiaRoadsStore((s) => s.sim);

  const [n, setN] = React.useState(120);
  const [spread, setSpread] = React.useState(0.15);
  const [xMetric, setXMetric] = React.useState<MetricKey>("netEmissions2050");
  const [yMetric, setYMetric] = React.useState<MetricKey>("ppmContribution2050");

  const [points, setPoints] = React.useState<
    Array<{ id: string; scenario: Scenario; summary: ReturnType<typeof summarize2050> }>
  >([]);

  const [sens, setSens] = React.useState<Array<{ lever: string; deltaCumGt: number }>>([]);

  const canRun = Boolean(inputs && scenario);

  function runMonteCarlo() {
    if (!inputs || !scenario) return;
    const pts: Array<{ id: string; scenario: Scenario; summary: ReturnType<typeof summarize2050> }> = [];
    const runs = Math.max(50, Math.min(500, n));
    for (let i = 0; i < runs; i++) {
      const s = randomScenarioAround(scenario, spread);
      const res = simulate(inputs, s);
      pts.push({ id: `${i}`, scenario: s, summary: summarize2050(res) });
    }
    setPoints(pts);
  }

  function runSensitivity() {
    if (!inputs || !scenario || !sim) return;
    const base = summarize2050(sim);
    const out: Array<{ lever: string; deltaCumGt: number }> = [];

    for (const lever of leverSpecs) {
      // one-at-a-time to max
      const sHi = { ...scenario, [lever.key]: lever.max } as Scenario;
      const hi = summarize2050(simulate(inputs, sHi));
      out.push({ lever: lever.title, deltaCumGt: hi.cumNetGt - base.cumNetGt });
    }

    out.sort((a, b) => Math.abs(b.deltaCumGt) - Math.abs(a.deltaCumGt));
    setSens(out.slice(0, 12));
  }

  const scatterOption = React.useMemo(() => {
    if (!points.length) return {};
    const data = points.map((p) => [metricValue(p.summary, xMetric), metricValue(p.summary, yMetric), p.id]);

    return {
      tooltip: {
        trigger: "item",
        formatter: (p: any) => {
          const id = p.data[2];
          const pt = points.find((x) => x.id === id);
          if (!pt) return "";
          const sx = metricValue(pt.summary, xMetric);
          const sy = metricValue(pt.summary, yMetric);
          return `${metricLabels[xMetric]}: ${sx.toFixed(2)}<br/>${metricLabels[yMetric]}: ${sy.toFixed(2)}<br/><span style='opacity:.7'>Click to load scenario</span>`;
        },
      },
      grid: { left: 55, right: 20, top: 25, bottom: 45 },
      xAxis: { type: "value", name: metricLabels[xMetric] },
      yAxis: { type: "value", name: metricLabels[yMetric] },
      series: [
        {
          type: "scatter",
          data,
          symbolSize: 9,
          emphasis: { focus: "series" },
        },
      ],
    };
  }, [points, xMetric, yMetric]);

  const scatterEvents = React.useMemo(() => {
    return {
      click: (p: any) => {
        const id = p?.data?.[2];
        const pt = points.find((x) => x.id === id);
        if (pt) {
          // Load this scenario into the main dashboard state
          setScenario(pt.scenario);
        }
      },
    };
  }, [points, setScenario]);

  const histOption = React.useMemo(() => {
    if (!points.length) return {};
    const xs = points.map((p) => metricValue(p.summary, "netEmissions2050"));
    const min = Math.min(...xs);
    const max = Math.max(...xs);
    const bins = 20;
    const step = (max - min) / bins || 1;
    const counts = new Array(bins).fill(0);
    for (const x of xs) {
      const idx = Math.min(bins - 1, Math.max(0, Math.floor((x - min) / step)));
      counts[idx] += 1;
    }
    const labels = counts.map((_, i) => {
      const a = min + i * step;
      const b = a + step;
      return `${a.toFixed(0)}–${b.toFixed(0)}`;
    });
    return {
      title: { text: "Distribution of 2050 net emissions", left: "center", top: 0, textStyle: { fontSize: 12, fontWeight: 600 } },
      tooltip: { trigger: "axis" },
      grid: { left: 45, right: 20, top: 35, bottom: 70 },
      xAxis: { type: "category", data: labels, axisLabel: { rotate: 35, interval: 1 } },
      yAxis: { type: "value", name: "count" },
      series: [{ type: "bar", data: counts }],
    };
  }, [points]);

  const sensOption = React.useMemo(() => {
    if (!sens.length) return {};
    const labels = sens.map((s) => s.lever);
    const vals = sens.map((s) => s.deltaCumGt);
    return {
      title: { text: "One-at-a-time sensitivity (Δ cumulative net CO₂)", left: "center", top: 0, textStyle: { fontSize: 12, fontWeight: 600 } },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      grid: { left: 190, right: 20, top: 35, bottom: 25 },
      xAxis: { type: "value", name: "ΔGt CO₂" },
      yAxis: { type: "category", data: labels, inverse: true },
      series: [
        {
          type: "bar",
          data: vals,
          itemStyle: {
            color: (p: any) => (p.value < 0 ? "#16a34a" : "#dc2626"),
          },
        },
      ],
    };
  }, [sens]);

  if (!inputs || !scenario || !baselineSim || !sim) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Explorer</h1>
        <p className="text-sm text-muted-foreground">
          Run many simulations (50+ per click) to explore trade-offs, sensitivity, and the “shape” of outcomes.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Monte Carlo around current levers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium"># simulations</div>
                <Slider value={[n]} min={50} max={500} step={10} onValueChange={(v) => setN(v[0])} />
                <div className="text-xs text-muted-foreground">{n} runs</div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Spread around current values</div>
                <Slider value={[spread]} min={0.05} max={0.30} step={0.01} onValueChange={(v) => setSpread(v[0])} />
                <div className="text-xs text-muted-foreground">±{Math.round(spread * 100)}% jitter</div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={runMonteCarlo} disabled={!canRun}>
                  Run simulations
                </Button>
                <Button variant="outline" onClick={runSensitivity}>
                  Sensitivity
                </Button>
              </div>

              <div className="grid gap-3">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">X axis</div>
                  <Select value={xMetric} onValueChange={(v) => setXMetric(v as MetricKey)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose X" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(metricLabels).map((k) => (
                        <SelectItem key={k} value={k}>
                          {metricLabels[k as MetricKey]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Y axis</div>
                  <Select value={yMetric} onValueChange={(v) => setYMetric(v as MetricKey)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose Y" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(metricLabels).map((k) => (
                        <SelectItem key={k} value={k}>
                          {metricLabels[k as MetricKey]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border border-border bg-background p-3 text-xs text-muted-foreground">
                Tip: click any point in the scatter plot to load that scenario into the main state.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Sensitivity ranking</CardTitle>
            </CardHeader>
            <CardContent>
              {sens.length ? (
                <EChart option={sensOption as any} style={{ height: 380 }} />
              ) : (
                <div className="text-sm text-muted-foreground">Run “Sensitivity” to see the biggest levers.</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Outcome cloud</CardTitle>
            </CardHeader>
            <CardContent>
              {points.length ? (
                <EChart option={scatterOption as any} onEvents={scatterEvents} style={{ height: 420 }} />
              ) : (
                <div className="text-sm text-muted-foreground">Run simulations to populate the chart.</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              {points.length ? (
                <EChart option={histOption as any} style={{ height: 320 }} />
              ) : (
                <div className="text-sm text-muted-foreground">Histogram will appear after you run simulations.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
