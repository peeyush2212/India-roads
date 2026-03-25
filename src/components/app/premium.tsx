"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIndiaRoadsStore } from "@/lib/store";

export function PremiumPage() {
  const premium = useIndiaRoadsStore((s) => s.premiumUnlocked);
  const openPaywall = useIndiaRoadsStore((s) => s.openPaywall);
  const unlockDemo = useIndiaRoadsStore((s) => s.unlockPremiumDemo);
  const searchParams = useSearchParams();
  const paid = searchParams.get("paid") === "1";
  const canceled = searchParams.get("canceled") === "1";

  const downloadUrl = "/premium/india_roads_premium_data_pack.zip";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Premium</h1>
        <p className="text-sm text-muted-foreground">
          Optional paid add‑ons: extra datasets and scenario templates. This page includes a demo checkout flow.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Premium Data Pack</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={premium ? "success" : "warn"}>
                {premium ? "Unlocked" : "Locked"}
              </Badge>
              <Badge variant="outline">₹500 one‑time</Badge>
            </div>

            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Peer dataset excerpt (CSV)</li>
              <li>Calibrated coefficient pack (JSON)</li>
              <li>Scenario templates (JSON)</li>
            </ul>

            {(paid || canceled) && (
              <div className="rounded-md border border-border bg-background p-3 text-sm">
                {paid ? (
                  <>
                    <div className="font-semibold">Stripe returned “paid=1” ✅</div>
                    <div className="mt-1 text-muted-foreground">
                      In a real setup, a webhook would verify payment and unlock premium automatically.
                    </div>
                    {!premium && (
                      <div className="mt-2">
                        <Button onClick={unlockDemo}>Unlock now (demo)</Button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="font-semibold">Checkout canceled</div>
                    <div className="mt-1 text-muted-foreground">No worries — you can try again any time.</div>
                  </>
                )}
              </div>
            )}

            {!premium ? (
              <Button onClick={openPaywall}>Unlock premium</Button>
            ) : (
              <a href={downloadUrl} className="inline-flex">
                <Button>Download data pack</Button>
              </a>
            )}

            <div className="text-xs text-muted-foreground">
              Note: because this is a front‑end demo, gating is stored in localStorage. For real paywalls, you’d
              secure downloads behind a server check.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">What’s next</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="list-disc space-y-1 pl-5">
              <li>Add real Stripe webhooks to verify payment → mint a signed cookie / JWT.</li>
              <li>Gate premium downloads via a Vercel Edge Function or server route.</li>
              <li>Offer monthly subscription (Stripe Billing) + seat-based org plans.</li>
              <li>Upload user datasets + allow custom calibration per state/sector.</li>
            </ul>

            <div className="rounded-md border border-border bg-background p-3 text-xs">
              Want a real checkout? Add Stripe env vars on Vercel and the Stripe tab in the paywall will redirect to
              Checkout.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Support</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This is intentionally lightweight and easy to deploy. If you want, we can extend it into a full product:
          sectoral emissions, NDC alignment, policy packs, and state-level dashboards.
        </CardContent>
      </Card>
    </div>
  );
}
