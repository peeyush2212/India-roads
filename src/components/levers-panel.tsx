"use client";

import * as React from "react";
import { leverGroups, leverSpecs } from "@/lib/uiConfig";
import { useIndiaRoadsStore } from "@/lib/store";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

function formatLeverValue(key: string, v: number) {
  if (!isFinite(v)) return "–";
  if (key === "Pop2050_billion") return `${v.toFixed(2)} B`;
  if (key === "GDPpc_CAGR_pct" || key === "EI_improve_pct_per_year") return `${v.toFixed(1)} %/yr`;
  if (key === "RD2050_pct_gdp") return `${v.toFixed(2)}%`;
  if (key === "RenewPatents2050_x") return `${v.toFixed(1)}×`;
  if (key === "AirControls_strength") return `${v.toFixed(2)}`;
  if (key.includes("pct") || key.includes("_pct")) return `${v.toFixed(0)}%`;
  return formatNumber(v);
}

export function LeversPanel({ className }: { className?: string }) {
  const scenario = useIndiaRoadsStore((s) => s.scenario);
  const setScenario = useIndiaRoadsStore((s) => s.setScenario);

  if (!scenario) {
    return (
      <div className={cn("rounded-lg border border-border p-4", className)}>
        Loading levers…
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <TooltipProvider>
        {leverGroups.map((group) => (
          <details key={group} open className="rounded-lg border border-border bg-card">
            <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold">
              {group}
            </summary>
            <div className="space-y-4 px-4 pb-4">
              {leverSpecs
                .filter((l) => l.group === group)
                .map((l) => {
                  const v = scenario[l.key];
                  return (
                    <div key={l.key} className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium leading-tight">{l.title}</div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-md hover:bg-accent"
                                aria-label={`Help: ${l.title}`}
                              >
                                <Info className="h-4 w-4 opacity-70" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="max-w-xs">{l.help}</div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="text-xs text-muted-foreground tabular-nums">
                          {formatLeverValue(l.key, v)}
                        </div>
                      </div>

                      <Slider
                        value={[v]}
                        min={l.min}
                        max={l.max}
                        step={l.step}
                        onValueChange={(val) => setScenario({ [l.key]: val[0] } as any)}
                        aria-label={l.title}
                      />
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>
                          {l.min} {l.unit}
                        </span>
                        <span>
                          {l.max} {l.unit}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </details>
        ))}
      </TooltipProvider>
    </div>
  );
}
