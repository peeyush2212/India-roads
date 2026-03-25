"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIndiaRoadsStore } from "@/lib/store";
import { encodeScenario } from "@/lib/scenarioCodec";
import { downloadText } from "@/lib/utils";
import { toCsv } from "@/lib/simulator";
import { Copy, Download, RotateCcw, Save, Trash2, GitCompareArrows } from "lucide-react";

export function ScenarioControls() {
  const scenario = useIndiaRoadsStore((s) => s.scenario);
  const sim = useIndiaRoadsStore((s) => s.sim);
  const premium = useIndiaRoadsStore((s) => s.premiumUnlocked);
  const openPaywall = useIndiaRoadsStore((s) => s.openPaywall);
  const resetScenario = useIndiaRoadsStore((s) => s.resetScenario);
  const saveScenario = useIndiaRoadsStore((s) => s.saveScenario);
  const saved = useIndiaRoadsStore((s) => s.saved);
  const loadScenario = useIndiaRoadsStore((s) => s.loadScenario);
  const deleteScenario = useIndiaRoadsStore((s) => s.deleteScenario);
  const compareIds = useIndiaRoadsStore((s) => s.compareIds);
  const toggleCompare = useIndiaRoadsStore((s) => s.toggleCompare);

  const [name, setName] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  function doCopyLink() {
    if (!scenario) return;
    const encoded = encodeScenario(scenario);
    const url = `${window.location.origin}${window.location.pathname}?s=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  }

  function doExportCsv() {
    if (!sim) return;
    downloadText("india_roads_scenario.csv", toCsv(sim.rows), "text/csv");
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Scenario tools</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-border bg-background p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold">Premium data</div>
              <div className="text-xs text-muted-foreground">Download extra datasets & templates (₹500)</div>
            </div>
            {premium ? (
              <a href="/premium/india_roads_premium_data_pack.zip" className="shrink-0">
                <Button variant="secondary">Download</Button>
              </a>
            ) : (
              <Button className="shrink-0" onClick={openPaywall}>
                Unlock
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={resetScenario}>
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button variant="outline" onClick={doCopyLink}>
            <Copy className="h-4 w-4" />
            {copied ? "Copied" : "Share link"}
          </Button>
          <Button variant="outline" onClick={doExportCsv}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name this scenario…"
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          />
          <Button
            onClick={() => {
              saveScenario(name);
              setName("");
            }}
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Saved scenarios (compare up to 3)</div>
          {saved.length === 0 ? (
            <div className="text-sm text-muted-foreground">No saved scenarios yet.</div>
          ) : (
            <div className="space-y-2">
              {saved.slice(0, 10).map((s) => {
                const inCompare = compareIds.includes(s.id);
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                  >
                    <button
                      className="flex-1 text-left text-sm hover:underline"
                      onClick={() => loadScenario(s.id)}
                    >
                      {s.name}
                    </button>
                    <Button
                      variant={inCompare ? "secondary" : "outline"}
                      size="icon"
                      onClick={() => toggleCompare(s.id)}
                      title="Compare"
                    >
                      <GitCompareArrows className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => deleteScenario(s.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
