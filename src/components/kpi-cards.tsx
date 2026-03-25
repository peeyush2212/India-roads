"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIndiaRoadsStore } from "@/lib/store";
import { summarize2050 } from "@/lib/simulator";
import { formatNumber } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

function Delta({
  value,
  unit,
  positiveIsGood = false,
}: {
  value: number;
  unit: string;
  positiveIsGood?: boolean;
}) {
  if (!isFinite(value) || Math.abs(value) < 1e-9) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        <span>≈ 0 {unit}</span>
      </div>
    );
  }
  const downIsGood = !positiveIsGood; // default: down is good for emissions, ppm, pm
  const isDown = value < 0;
  const Icon = isDown ? ArrowDownRight : ArrowUpRight;
  const color = isDown === downIsGood ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
  return (
    <div className={`flex items-center gap-1 text-xs ${color}`.trim()}>
      <Icon className="h-3 w-3" />
      <span>
        {formatNumber(Math.abs(value), { maximumFractionDigits: 1 })} {unit}
      </span>
    </div>
  );
}

export function KpiCards() {
  const baselineSim = useIndiaRoadsStore((s) => s.baselineSim);
  const sim = useIndiaRoadsStore((s) => s.sim);

  const data = React.useMemo(() => {
    if (!baselineSim || !sim) return null;
    const b = summarize2050(baselineSim);
    const c = summarize2050(sim);
    return { b, c };
  }, [baselineSim, sim]);

  if (!data) {
    return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">Loading…</div>;
  }

  const { b, c } = data;

  const cards = [
    {
      title: "2050 Net CO₂",
      value: `${formatNumber(c.netEmissions2050, { maximumFractionDigits: 0 })} Mt`,
      delta: c.netEmissions2050 - b.netEmissions2050,
      unit: "Mt",
    },
    {
      title: "Cumulative Net CO₂",
      value: `${formatNumber(c.cumNetGt, { maximumFractionDigits: 1 })} Gt`,
      delta: c.cumNetGt - b.cumNetGt,
      unit: "Gt",
    },
    {
      title: "Atm. CO₂ (Δppm)",
      value: `${formatNumber(c.ppmContribution2050, { maximumFractionDigits: 1 })} ppm`,
      delta: c.ppmContribution2050 - b.ppmContribution2050,
      unit: "ppm",
    },
    {
      title: "Renewables (2050)",
      value: `${formatNumber(c.renewables2050, { maximumFractionDigits: 0 })}%`,
      delta: c.renewables2050 - b.renewables2050,
      unit: "pp",
      positiveIsGood: true,
    },
    {
      title: "Energy intensity (2050)",
      value: `${formatNumber(c.ei2050, { maximumFractionDigits: 2 })}`,
      delta: c.ei2050 - b.ei2050,
      unit: "MJ/$",
    },
    {
      title: "PM2.5 exposed (2050)",
      value: `${formatNumber(c.pm25_2050, { maximumFractionDigits: 1 })}%`,
      delta: c.pm25_2050 - b.pm25_2050,
      unit: "pp",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      {cards.map((x) => (
        <Card key={x.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{x.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-xl font-semibold tabular-nums">{x.value}</div>
            <Delta value={x.delta} unit={x.unit} positiveIsGood={Boolean((x as any).positiveIsGood)} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
