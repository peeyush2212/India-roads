"use client";

import * as React from "react";
import { useIndiaRoadsStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNumber, downloadText } from "@/lib/utils";

export function DataModel() {
  const inputs = useIndiaRoadsStore((s) => s.inputs);
  const premium = useIndiaRoadsStore((s) => s.premiumUnlocked);
  const openPaywall = useIndiaRoadsStore((s) => s.openPaywall);

  if (!inputs) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const b = inputs.indiaBaseline;
  const p = inputs.worldInsights.percentiles;
  const peers = inputs.worldInsights.peersLargePop;
  const betas = inputs.calibration.betas;
  const pm = inputs.calibration.pm_metrics;

  const co2Pc = (b.co2_mt * 1e6) / b.population;
  const gdpTotal = b.population * b.gdppc_ppp;

  function downloadModelInputs() {
    downloadText("model_inputs.json", JSON.stringify(inputs, null, 2), "application/json");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Data & Model</h1>
        <p className="text-sm text-muted-foreground">
          What’s under the hood: baseline data, panel-calibrated elasticities, and the simplified carbon cycle.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">India baseline (2021)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md border border-border p-3">
                <div className="text-xs text-muted-foreground">CO₂ (total)</div>
                <div className="text-lg font-semibold tabular-nums">{formatNumber(b.co2_mt, { maximumFractionDigits: 0 })} Mt</div>
                <div className="text-xs text-muted-foreground">Percentile: {p.co2_total_mt?.toFixed?.(1) ?? "–"}</div>
              </div>
              <div className="rounded-md border border-border p-3">
                <div className="text-xs text-muted-foreground">CO₂ per capita</div>
                <div className="text-lg font-semibold tabular-nums">{formatNumber(co2Pc, { maximumFractionDigits: 2 })} t</div>
                <div className="text-xs text-muted-foreground">Percentile: {p.co2_pc_t?.toFixed?.(1) ?? "–"}</div>
              </div>
              <div className="rounded-md border border-border p-3">
                <div className="text-xs text-muted-foreground">GDP per capita (PPP)</div>
                <div className="text-lg font-semibold tabular-nums">{formatNumber(b.gdppc_ppp, { maximumFractionDigits: 0 })}</div>
                <div className="text-xs text-muted-foreground">Percentile: {p.gdppc_ppp?.toFixed?.(1) ?? "–"}</div>
              </div>
              <div className="rounded-md border border-border p-3">
                <div className="text-xs text-muted-foreground">Renewables share (proxy)</div>
                <div className="text-lg font-semibold tabular-nums">{formatNumber(b.renewables_share, { maximumFractionDigits: 0 })}%</div>
                <div className="text-xs text-muted-foreground">Percentile: {p.renewables_share?.toFixed?.(1) ?? "–"}</div>
              </div>
            </div>

            <div className="rounded-md border border-border bg-background p-3 text-xs text-muted-foreground">
              Total GDP (PPP): <span className="font-mono">{formatNumber(gdpTotal, { notation: "compact", maximumFractionDigits: 2 })}</span>
              <br />
              Land area: <span className="font-mono">{formatNumber(b.land_area_km2, { maximumFractionDigits: 0 })} km²</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={downloadModelInputs}>
                Download model inputs (JSON)
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Peers (large population) — 2021</CardTitle>
          </CardHeader>
          <CardContent className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="py-2">Country</th>
                  <th className="py-2">Pop (M)</th>
                  <th className="py-2">CO₂/cap</th>
                  <th className="py-2">GDPpc</th>
                  <th className="py-2">EI</th>
                  <th className="py-2">RE%</th>
                </tr>
              </thead>
              <tbody>
                {peers.slice(0, 12).map((r: any) => (
                  <tr key={r.country} className="border-t border-border">
                    <td className="py-2 font-medium">{r.country}</td>
                    <td className="py-2 tabular-nums">{formatNumber(r.pop_m as number, { maximumFractionDigits: 1 })}</td>
                    <td className="py-2 tabular-nums">{formatNumber(r.co2_pc as number, { maximumFractionDigits: 2 })}</td>
                    <td className="py-2 tabular-nums">{formatNumber((r as any)["GDP per capita, PPP (constant 2017 international $)"] as number, { maximumFractionDigits: 0 })}</td>
                    <td className="py-2 tabular-nums">{formatNumber((r as any)["Energy intensity level of primary energy (MJ/$2017 PPP GDP)"] as number, { maximumFractionDigits: 2 })}</td>
                    <td className="py-2 tabular-nums">{formatNumber((r as any)["Renewable energy consumption (% of total final energy consumption)_x"] as number, { maximumFractionDigits: 0 })}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Panel-calibrated elasticities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              These coefficients are estimated from a global country‑year panel and then applied to India as proxy
              elasticities.
            </div>
            <div className="mt-4 overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="py-2">Parameter</th>
                    <th className="py-2">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(betas)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([k, v]) => (
                      <tr key={k} className="border-t border-border">
                        <td className="py-2 font-mono text-xs">{k}</td>
                        <td className="py-2 tabular-nums">{formatNumber(v, { maximumFractionDigits: 6 })}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">PM2.5 proxy model fit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">R²: {pm.r2?.toFixed?.(3) ?? "–"}</Badge>
              <Badge variant="outline">RMSE: {pm.rmse?.toFixed?.(3) ?? "–"}</Badge>
              <Badge variant="outline">MAE: {pm.mae?.toFixed?.(3) ?? "–"}</Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              PM2.5 here is a *proxy* driven by GDPpc, CO₂/cap, renewables share, clean cooking access and
              urbanization — then reduced by the Air Controls lever.
            </div>

            <div className="rounded-md border border-border bg-background p-3 text-xs text-muted-foreground">
              Want the premium data pack (peer tables + templates)?
              <div className="mt-2">
                <Button onClick={openPaywall}>{premium ? "Premium unlocked" : "Unlock Premium"}</Button>
              </div>
            </div>

            {premium && (
              <div className="rounded-md border border-border bg-card p-3">
                <div className="text-sm font-semibold">Premium unlocked ✅</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Go to the Premium page to download the data pack.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Model notes (important)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              This is a *Kaya identity* simulator (Population × GDP/cap × Energy intensity × Carbon intensity), with
              a forest sink and a small carbon cycle approximation.
            </li>
            <li>
              “Renewables share” is treated as a proxy for carbon intensity; it includes traditional biomass in the
              underlying World Bank series.
            </li>
            <li>
              The slider impacts are calibrated from global panel correlations; they are conservative and bounded to
              avoid unrealistic extremes.
            </li>
            <li>
              This tool is best for *directional* insight and scenario comparison, not official forecasting.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
