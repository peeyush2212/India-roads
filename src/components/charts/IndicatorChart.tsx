"use client";

import * as React from "react";
import { useIndiaRoadsStore } from "@/lib/store";
import { EChart } from "@/components/charts/EChart";
import type { EChartsOption } from "echarts";

export function IndicatorChart({
  title,
  field,
  yLabel,
  formatter,
}: {
  title: string;
  field: keyof (import("@/lib/types").SimulationRow);
  yLabel: string;
  formatter?: (v: number) => string;
}) {
  const baselineSim = useIndiaRoadsStore((s) => s.baselineSim);
  const sim = useIndiaRoadsStore((s) => s.sim);
  const zoom = useIndiaRoadsStore((s) => s.zoom);

  const option = React.useMemo<EChartsOption>(() => {
    if (!baselineSim || !sim) return {};
    const years = sim.rows.map((r) => r.year);
    const base = baselineSim.rows.map((r) => (r as any)[field] as number);
    const cur = sim.rows.map((r) => (r as any)[field] as number);

    const startYear = zoom?.startYear ?? years[0];
    const endYear = zoom?.endYear ?? years[years.length - 1];

    return {
      title: { text: title, left: "center", top: 0, textStyle: { fontSize: 12, fontWeight: 600 } },
      tooltip: { trigger: "axis" },
      grid: { left: 50, right: 20, top: 32, bottom: 40 },
      xAxis: { type: "category", data: years, boundaryGap: false },
      yAxis: { type: "value", name: yLabel },
      dataZoom: [
        { type: "inside", startValue: startYear, endValue: endYear },
        { type: "slider", height: 18, bottom: 10, startValue: startYear, endValue: endYear },
      ],
      series: [
        { name: "Baseline", type: "line", data: base, showSymbol: false, lineStyle: { type: "dashed", width: 2 } },
        { name: "Current", type: "line", data: cur, showSymbol: false, lineStyle: { width: 3 } },
      ],
    };
  }, [baselineSim, sim, field, title, yLabel, zoom]);

  return <EChart option={option} style={{ height: 260 }} />;
}
