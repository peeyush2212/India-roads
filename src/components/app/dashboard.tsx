"use client";

import * as React from "react";
import { KpiCards } from "@/components/kpi-cards";
import { LeversPanel } from "@/components/levers-panel";
import { ScenarioControls } from "@/components/scenario-controls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmissionsChart } from "@/components/charts/EmissionsChart";
import { IndicatorChart } from "@/components/charts/IndicatorChart";
import { WaterfallChart } from "@/components/charts/WaterfallChart";
import { CompareEmissionsChart } from "@/components/charts/CompareEmissionsChart";
import { useIndiaRoadsStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";

export function Dashboard() {
  const inputs = useIndiaRoadsStore((s) => s.inputs);

  if (!inputs) {
    return <div className="text-sm text-muted-foreground">Loading model…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">India emissions simulator</h1>
          <p className="text-sm text-muted-foreground">
            Move the levers to explore India’s CO₂ pathway. Calibrated on World Bank panel (global) and anchored to
            India’s 2021 baseline.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Base year: {inputs.meta.baseYear}</Badge>
          <Badge variant="outline">Horizon: {inputs.meta.endYear}</Badge>
        </div>
      </div>

      <KpiCards />

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <div className="space-y-6">
          <ScenarioControls />
          <LeversPanel />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Net CO₂ emissions trajectory</CardTitle>
            </CardHeader>
            <CardContent>
              <EmissionsChart />
            </CardContent>
          </Card>

          <CompareEmissionsChart />

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardContent className="pt-5">
                <IndicatorChart title="Renewables share" field="renewables_share" yLabel="%" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <IndicatorChart title="Energy intensity" field="energy_intensity" yLabel="MJ per $" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <IndicatorChart title="PM2.5 exposure (proxy)" field="pm25_exposed_pct" yLabel="% of population" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <IndicatorChart title="Atmospheric CO₂ contribution" field="atm_co2_ppm_contribution" yLabel="ppm" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-5">
              <WaterfallChart />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
