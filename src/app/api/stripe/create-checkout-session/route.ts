import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const amountInr = Number(body?.amountInr ?? 500);

    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      return NextResponse.json(
        { error: "STRIPE_SECRET_KEY is not set. Configure Stripe env vars on Vercel." },
        { status: 400 }
      );
    }

    const stripe = new Stripe(secret);

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const priceId = process.env.STRIPE_PRICE_ID;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: priceId
        ? [{ price: priceId, quantity: 1 }]
        : [
            {
              price_data: {
                currency: "inr",
                product_data: {
                  name: "India‑ROADS Premium Data Pack",
                  description: "One-time purchase (demo)",
                },
                unit_amount: Math.round(amountInr * 100),
              },
              quantity: 1,
            },
          ],
      success_url: `${origin}/premium?paid=1`,
      cancel_url: `${origin}/premium?canceled=1`,
      metadata: {
        product: "india-roads-premium",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Stripe error" }, { status: 500 });
  }
}
