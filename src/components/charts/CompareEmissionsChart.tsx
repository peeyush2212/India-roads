"use client";

import * as React from "react";
import type { EChartsOption } from "echarts";
import { useIndiaRoadsStore } from "@/lib/store";
import { simulate } from "@/lib/simulator";
import { EChart } from "@/components/charts/EChart";

export function CompareEmissionsChart() {
  const inputs = useIndiaRoadsStore((s) => s.inputs);
  const baselineSim = useIndiaRoadsStore((s) => s.baselineSim);
  const sim = useIndiaRoadsStore((s) => s.sim);
  const saved = useIndiaRoadsStore((s) => s.saved);
  const compareIds = useIndiaRoadsStore((s) => s.compareIds);

  const option = React.useMemo<EChartsOption>(() => {
    if (!inputs || !baselineSim || !sim) return {};
    const years = sim.rows.map((r) => r.year);

    const series: any[] = [
      {
        name: "Baseline",
        type: "line",
        data: baselineSim.rows.map((r) => r.net_emissions_mtco2),
        showSymbol: false,
        lineStyle: { type: "dashed", width: 2 },
      },
      {
        name: "Current",
        type: "line",
        data: sim.rows.map((r) => r.net_emissions_mtco2),
        showSymbol: false,
        lineStyle: { width: 3 },
      },
    ];

    for (const id of compareIds) {
      const s = saved.find((x) => x.id === id);
      if (!s) continue;
      const res = simulate(inputs, s.scenario);
      series.push({
        name: s.name,
        type: "line",
        data: res.rows.map((r) => r.net_emissions_mtco2),
        showSymbol: false,
        lineStyle: { width: 2 },
      });
    }

    return {
      tooltip: { trigger: "axis" },
      legend: { top: 0 },
      grid: { left: 40, right: 20, top: 30, bottom: 40 },
      xAxis: { type: "category", data: years, boundaryGap: false },
      yAxis: { type: "value", name: "MtCO₂/yr" },
      series,
    };
  }, [inputs, baselineSim, sim, saved, compareIds]);

  if (!compareIds.length) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-2 text-sm font-semibold">Compare scenarios (net emissions)</div>
      <EChart option={option} style={{ height: 260 }} />
    </div>
  );
}
