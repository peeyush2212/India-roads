"use client";

import * as React from "react";
import { useIndiaRoadsStore } from "@/lib/store";
import { makeWaterfallContributions } from "@/lib/simulator";
import { EChart } from "@/components/charts/EChart";
import type { EChartsOption } from "echarts";

export function WaterfallChart() {
  const baselineSim = useIndiaRoadsStore((s) => s.baselineSim);
  const sim = useIndiaRoadsStore((s) => s.sim);

  const option = React.useMemo<EChartsOption>(() => {
    if (!baselineSim || !sim) return {};

    const wf = makeWaterfallContributions(baselineSim, sim);

    const labels = ["Baseline (2050)", ...wf.contrib.map((c) => c.name), "Current (2050)"];
    const baseVal = wf.baselineNet;

    // Build cumulative for waterfall
    const deltas = wf.contrib.map((c) => c.value);
    const cum: number[] = [baseVal];
    for (const d of deltas) cum.push(cum[cum.length - 1] + d);

    const placeholder: number[] = [];
    const bars: number[] = [];

    // baseline bar
    placeholder.push(0);
    bars.push(baseVal);

    // delta bars
    for (let i = 0; i < deltas.length; i++) {
      const prev = cum[i];
      const d = deltas[i];
      const start = d >= 0 ? prev : prev + d;
      placeholder.push(start);
      bars.push(Math.abs(d));
    }

    // current total bar
    placeholder.push(0);
    bars.push(wf.currentNet);

    return {
      title: {
        text: "2050 Net CO₂ change vs Baseline (waterfall)",
        left: "center",
        top: 0,
        textStyle: { fontSize: 12, fontWeight: 600 },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
      },
      grid: { left: 50, right: 20, top: 32, bottom: 70 },
      xAxis: {
        type: "category",
        data: labels,
        axisLabel: { rotate: 25, interval: 0 },
      },
      yAxis: { type: "value", name: "MtCO₂/yr" },
      series: [
        {
          type: "bar",
          stack: "total",
          itemStyle: { color: "transparent" },
          emphasis: { itemStyle: { color: "transparent" } },
          data: placeholder,
        },
        {
          name: "Change",
          type: "bar",
          stack: "total",
          data: bars,
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: (p: any) => {
              const idx = p.dataIndex;
              if (idx === 0 || idx === labels.length - 1) return "#64748b"; // totals
              const raw = deltas[idx - 1];
              // reductions (negative delta) shown green, increases red
              return raw < 0 ? "#16a34a" : "#dc2626";
            },
          },
          label: {
            show: true,
            position: "top",
            formatter: (p: any) => {
              const idx = p.dataIndex;
              if (idx === 0) return "";
              if (idx === labels.length - 1) return "";
              const raw = deltas[idx - 1];
              const sign = raw >= 0 ? "+" : "";
              return `${sign}${raw.toFixed(0)}`;
            },
            fontSize: 10,
          },
        },
      ],
    };
  }, [baselineSim, sim]);

  return <EChart option={option} style={{ height: 320 }} />;
}
