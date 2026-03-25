"use client";

import * as React from "react";
import { useIndiaRoadsStore } from "@/lib/store";
import { EChart } from "@/components/charts/EChart";
import type { EChartsOption } from "echarts";

export function EmissionsChart() {
  const baselineSim = useIndiaRoadsStore((s) => s.baselineSim);
  const sim = useIndiaRoadsStore((s) => s.sim);
  const zoom = useIndiaRoadsStore((s) => s.zoom);
  const setZoom = useIndiaRoadsStore((s) => s.setZoom);

  const option = React.useMemo<EChartsOption>(() => {
    if (!baselineSim || !sim) return {};
    const years = sim.rows.map((r) => r.year);
    const base = baselineSim.rows.map((r) => r.net_emissions_mtco2);
    const cur = sim.rows.map((r) => r.net_emissions_mtco2);

    const startIndex = zoom ? Math.max(0, years.indexOf(zoom.startYear)) : 0;
    const endIndex = zoom ? Math.max(0, years.indexOf(zoom.endYear)) : years.length - 1;

    return {
      tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
      legend: { data: ["Baseline", "Current"], top: 0 },
      grid: { left: 40, right: 20, top: 30, bottom: 40 },
      xAxis: { type: "category", data: years, boundaryGap: false },
      yAxis: { type: "value", name: "MtCO₂/yr" },
      dataZoom: [
        { type: "inside", startValue: years[startIndex], endValue: years[endIndex] },
        { type: "slider", height: 18, bottom: 10, startValue: years[startIndex], endValue: years[endIndex] },
      ],
      series: [
        {
          name: "Baseline",
          type: "line",
          data: base,
          showSymbol: false,
          lineStyle: { type: "dashed", width: 2 },
        },
        {
          name: "Current",
          type: "line",
          data: cur,
          showSymbol: false,
          lineStyle: { width: 3 },
          areaStyle: { opacity: 0.08 },
        },
      ],
    };
  }, [baselineSim, sim, zoom]);

  const onEvents = React.useMemo(() => {
    return {
      datazoom: (params: any) => {
        try {
          if (!sim) return;
          const years = sim.rows.map((r) => r.year);
          const batch = params?.batch?.[0] ?? params;
          const startValue = batch?.startValue ?? years[0];
          const endValue = batch?.endValue ?? years[years.length - 1];
          if (typeof startValue === "number" && typeof endValue === "number") {
            setZoom({ startYear: startValue, endYear: endValue });
          }
        } catch {
          // ignore
        }
      },
    };
  }, [sim, setZoom]);

  return <EChart option={option} style={{ height: 320 }} onEvents={onEvents} />;
}
