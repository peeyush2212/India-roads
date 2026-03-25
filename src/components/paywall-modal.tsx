"use client";

import * as React from "react";
import QRCode from "react-qr-code";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useIndiaRoadsStore } from "@/lib/store";
import { Copy, ExternalLink } from "lucide-react";

const UPI_ID = "peeyush2212@okhdfcbank";
const AMOUNT_INR = 500;

function buildUpiUri() {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: "IndiaROADS Premium",
    am: String(AMOUNT_INR),
    cu: "INR",
    tn: "IndiaROADS Premium Data Pack",
  });
  return `upi://pay?${params.toString()}`;
}

export function PaywallModal() {
  const open = useIndiaRoadsStore((s) => s.paywallOpen);
  const close = useIndiaRoadsStore((s) => s.closePaywall);
  const unlockDemo = useIndiaRoadsStore((s) => s.unlockPremiumDemo);

  const [status, setStatus] = React.useState<string>("");
  const upiUri = React.useMemo(() => buildUpiUri(), []);

  async function startStripeCheckout() {
    setStatus("");
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountInr: AMOUNT_INR }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data?.error || "Stripe is not configured yet.");
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setStatus("Stripe response missing url.");
      }
    } catch (e: any) {
      setStatus(e?.message || "Stripe checkout failed.");
    }
  }

  function copyUpi() {
    navigator.clipboard.writeText(UPI_ID);
    setStatus("UPI ID copied.");
    setTimeout(() => setStatus(""), 1200);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? close() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unlock Premium Data Pack</DialogTitle>
          <DialogDescription>
            ₹{AMOUNT_INR} one‑time. This demo flow shows how a paywall could work (Stripe + UPI QR). It does not
            need to be fully functional yet.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upi">
          <TabsList>
            <TabsTrigger value="upi">UPI / GPay</TabsTrigger>
            <TabsTrigger value="stripe">Stripe</TabsTrigger>
          </TabsList>

          <TabsContent value="upi">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-md border border-border bg-card p-4">
                <div className="text-sm font-semibold">Scan & Pay (UPI)</div>
                <div className="mt-2 text-xs text-muted-foreground">Pay to: {UPI_ID}</div>
                <div className="mt-3 flex items-center justify-center rounded-md bg-white p-3">
                  <QRCode value={upiUri} size={180} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline" onClick={copyUpi}>
                    <Copy className="h-4 w-4" />
                    Copy UPI ID
                  </Button>
                  <a href={upiUri} className="inline-flex">
                    <Button variant="outline">
                      <ExternalLink className="h-4 w-4" />
                      Open in UPI app
                    </Button>
                  </a>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  On mobile, tapping “Open in UPI app” should open Google Pay / PhonePe / Paytm.
                </div>
              </div>

              <div className="rounded-md border border-border bg-card p-4">
                <div className="text-sm font-semibold">What you get</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  <li>Premium data pack download (CSV + JSON templates)</li>
                  <li>Extra Explorer views (global comparisons & templates)</li>
                  <li>Shareable scenario presets</li>
                </ul>

                <div className="mt-4 rounded-md border border-border bg-background p-3 text-xs text-muted-foreground">
                  <div className="font-medium text-foreground">Demo unlock</div>
                  This project is in early stage. For now, click the button below to simulate a successful payment.
                </div>

                <div className="mt-3">
                  <Button onClick={unlockDemo}>I’ve paid (demo unlock)</Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stripe">
            <div className="rounded-md border border-border bg-card p-4">
              <div className="text-sm font-semibold">Stripe Checkout</div>
              <div className="mt-2 text-sm text-muted-foreground">
                If you add Stripe keys in Vercel env vars, this button will create a Checkout Session and redirect.
                If you don’t, it will show a “not configured” error.
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button onClick={startStripeCheckout}>Checkout ₹{AMOUNT_INR}</Button>
                <Button variant="outline" onClick={unlockDemo}>
                  Demo unlock
                </Button>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                Env vars expected: <span className="font-mono">STRIPE_SECRET_KEY</span> and optionally <span className="font-mono">STRIPE_PRICE_ID</span>.
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {status && <div className="text-sm text-muted-foreground">{status}</div>}

        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
